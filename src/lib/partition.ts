import type { PartitionValidationResult } from '../types/challenge';

/**
 * Validates whether the given target can be mathematically partitioned into
 * whole integer values within [minAmount, maxAmount].
 */
export function validatePartitionFeasibility(
  target: number,
  minAmount: number,
  maxAmount: number
): PartitionValidationResult {
  if (target <= 0) {
    return {
      isValid: false,
      errorMessage: 'Target amount must be greater than zero.',
      minPossibleTarget: minAmount > 0 ? minAmount : 1,
    };
  }

  if (minAmount <= 0) {
    return {
      isValid: false,
      errorMessage: 'Minimum savings amount must be at least 1.',
      minPossibleTarget: 1,
    };
  }

  if (maxAmount < minAmount) {
    return {
      isValid: false,
      errorMessage: 'Maximum amount cannot be less than minimum amount.',
    };
  }

  if (target < minAmount) {
    return {
      isValid: false,
      errorMessage: `Target amount (${target}) cannot be smaller than minimum daily amount (${minAmount}).`,
      minPossibleTarget: minAmount,
      suggestedTarget: minAmount,
    };
  }

  // An integer target T can be formed by k entries in [min, max] if and only if
  // k * min <= T <= k * max for some integer k >= 1.
  const kMin = Math.ceil(target / maxAmount);
  const kMax = Math.floor(target / minAmount);

  if (kMin <= kMax) {
    return {
      isValid: true,
      minDays: kMin,
      maxDays: kMax,
    };
  }

  // In between valid intervals (gap between (k-1)*max and k*min)
  // Example: min=100, max=120, target=150. k=1 => [100, 120], k=2 => [200, 240].
  const lowerSuggested = (kMin - 1) * maxAmount;
  const upperSuggested = kMin * minAmount;

  return {
    isValid: false,
    errorMessage: `Target ${target} cannot be partitioned into valid whole units between ${minAmount} and ${maxAmount}.`,
    suggestedTarget: upperSuggested > 0 ? upperSuggested : lowerSuggested,
    minDays: kMin,
    maxDays: kMax,
  };
}

/**
 * Constrained randomized partition algorithm.
 * Partitions `target` into whole integer amounts within [minAmount, maxAmount],
 * guaranteeing that:
 * 1. Every amount is in [minAmount, maxAmount]
 * 2. Sum of all amounts equals target exactly
 * 3. Total entries count is realistic and randomized
 */
export function generateConstrainedPartition(
  target: number,
  minAmount: number,
  maxAmount: number,
  preferredDays?: number
): number[] {
  const validation = validatePartitionFeasibility(target, minAmount, maxAmount);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid partition parameters.');
  }

  const kMin = validation.minDays!;
  const kMax = validation.maxDays!;

  // Choose the number of days (k)
  let k: number;
  if (preferredDays && preferredDays >= kMin && preferredDays <= kMax) {
    k = preferredDays;
  } else {
    // Choose around the middle of [kMin, kMax] with natural random jitter
    const avgAmount = (minAmount + maxAmount) / 2;
    const nominalK = Math.round(target / avgAmount);
    const clampedK = Math.max(kMin, Math.min(kMax, nominalK));

    // Add slight random variation between generated plans (+/- 15% range if possible)
    const span = Math.max(0, Math.floor((kMax - kMin) * 0.15));
    const jitter = span > 0 ? Math.floor(Math.random() * (span * 2 + 1)) - span : 0;
    k = Math.max(kMin, Math.min(kMax, clampedK + jitter));
  }

  const partition: number[] = [];
  let remainingTarget = target;

  for (let i = 0; i < k; i++) {
    const remainingDays = k - 1 - i;

    if (remainingDays === 0) {
      // Last entry must equal remainingTarget
      if (remainingTarget < minAmount || remainingTarget > maxAmount) {
        // Fallback safety check: should never happen with the bounds below
        throw new Error(`Algorithm state error on final entry: ${remainingTarget}`);
      }
      partition.push(remainingTarget);
      remainingTarget = 0;
      break;
    }

    // Bounds for current entry x such that:
    // remainingDays * minAmount <= (remainingTarget - x) <= remainingDays * maxAmount
    const lowerBound = Math.max(minAmount, remainingTarget - remainingDays * maxAmount);
    const upperBound = Math.min(maxAmount, remainingTarget - remainingDays * minAmount);

    if (lowerBound > upperBound) {
      throw new Error(`Infeasible bound on day ${i + 1}: [${lowerBound}, ${upperBound}]`);
    }

    // Pick random whole integer in [lowerBound, upperBound]
    // Use slightly centered random distribution to avoid extreme spikes
    const r1 = Math.random();
    const r2 = Math.random();
    const randFactor = (r1 + r2) / 2; // triangular distribution
    const chosen = Math.round(lowerBound + randFactor * (upperBound - lowerBound));
    const clampedChosen = Math.max(lowerBound, Math.min(upperBound, chosen));

    partition.push(clampedChosen);
    remainingTarget -= clampedChosen;
  }

  // Shuffle partition so higher/lower amounts are nicely interspersed throughout the challenge
  // instead of trending downwards or upwards
  shuffleArray(partition);

  // Verification invariant check
  const totalSum = partition.reduce((acc, v) => acc + v, 0);
  if (totalSum !== target) {
    throw new Error(`Partition sum error: expected ${target}, got ${totalSum}`);
  }

  return partition;
}

/**
 * Generates the next eligible amount for "Daily Surprise" mode (Mode B).
 * Guarantees that remaining balance after this amount can still be completed
 * legally with integers in [minAmount, maxAmount].
 */
export function generateNextSurpriseAmount(
  remainingTarget: number,
  minAmount: number,
  maxAmount: number
): number {
  if (remainingTarget <= 0) {
    throw new Error('Remaining target must be positive.');
  }

  // If remaining is within range, we can finish it right now
  if (remainingTarget >= minAmount && remainingTarget <= maxAmount) {
    return remainingTarget;
  }

  // Find all possible integers x in [minAmount, maxAmount]
  // such that (remainingTarget - x) is feasible
  const validCandidates: number[] = [];
  const start = minAmount;
  const end = Math.min(maxAmount, remainingTarget - minAmount);

  for (let x = start; x <= end; x++) {
    const nextRemaining = remainingTarget - x;
    if (nextRemaining === 0) {
      validCandidates.push(x);
    } else {
      const v = validatePartitionFeasibility(nextRemaining, minAmount, maxAmount);
      if (v.isValid) {
        validCandidates.push(x);
      }
    }
  }

  if (validCandidates.length === 0) {
    // Edge-case safeguard: if no candidate leaves a valid remainder, clamp to remainingTarget
    return Math.min(maxAmount, Math.max(minAmount, remainingTarget));
  }

  // Pick random candidate
  const randomIndex = Math.floor(Math.random() * validCandidates.length);
  return validCandidates[randomIndex];
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
