// lib/unlock.ts

export type UnlockStateInput = {
    isUnlocked: boolean;
    userAId: string;
    userBId: string;
    unlockProgressA: number;
    unlockProgressB: number;
    lastSenderId: string | null;
    senderId: string;
  };
  
  export type UnlockStateOutput = {
    isNewTurn: boolean;
    nextA: number;
    nextB: number;
    total: number;
    willUnlock: boolean;
    unlockReason: string | null;
  };
  
  /**
   * Depth unlock rule:
   * - Photos unlock after 5 alternating replies (turns).
   * - "Turn" means the sender differs from the previous message sender.
   * - Progress is tracked per side (A/B) and summed.
   *
   * NOTE: Most endpoints also enforce "no 2 messages in a row",
   * so isNewTurn is usually true. This helper keeps the logic centralized.
   */
  export function computeUnlockUpdate(input: UnlockStateInput): UnlockStateOutput {
    const { isUnlocked, userAId, userBId, unlockProgressA, unlockProgressB, lastSenderId, senderId } = input;
  
    const isNewTurn = !lastSenderId || lastSenderId !== senderId;
  
    if (isUnlocked) {
      const total = unlockProgressA + unlockProgressB;
      return {
        isNewTurn,
        nextA: unlockProgressA,
        nextB: unlockProgressB,
        total,
        willUnlock: true,
        unlockReason: null,
      };
    }
  
    const senderIsA = senderId === userAId;
    const senderIsB = senderId === userBId;
  
    // Safety: if sender isn't part of match, do nothing.
    if (!senderIsA && !senderIsB) {
      const total = unlockProgressA + unlockProgressB;
      return {
        isNewTurn: false,
        nextA: unlockProgressA,
        nextB: unlockProgressB,
        total,
        willUnlock: false,
        unlockReason: null,
      };
    }
  
    const nextA = isNewTurn && senderIsA ? Math.min(5, unlockProgressA + 1) : unlockProgressA;
    const nextB = isNewTurn && senderIsB ? Math.min(5, unlockProgressB + 1) : unlockProgressB;
    const total = nextA + nextB;
    const willUnlock = total >= 5;
  
    return {
      isNewTurn,
      nextA,
      nextB,
      total,
      willUnlock,
      unlockReason: willUnlock ? "5 alternatieve antwoorden behaald" : null,
    };
  }
  