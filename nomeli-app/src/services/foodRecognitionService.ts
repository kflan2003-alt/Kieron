import { FoodRecognitionResult, FoodRecognitionResultItem } from '../types';
import { MOCK_FOOD_CATALOGUE } from './mockData';
import { addDays, todayISO } from '../utils/expiry';

/**
 * Recognises food from one or more photos.
 *
 * The real implementation will call a vision/LLM API and return the same
 * shape described in the build brief:
 *   { items: [{ name, quantity, unit, expiryDate, expiryType, category, confidence }] }
 *
 * Nothing outside this file should know whether the result came from a
 * real model or a mock — swap `MockFoodRecognitionService` for a real one
 * behind `getFoodRecognitionService()` and the rest of the app is
 * unaffected.
 */
export interface FoodRecognitionService {
  recognise(photoUris: string[]): Promise<FoodRecognitionResult>;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export class MockFoodRecognitionService implements FoodRecognitionService {
  async recognise(photoUris: string[]): Promise<FoodRecognitionResult> {
    // Simulate model latency so the "Nomeli is checking your food…" state
    // feels real rather than instant.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const count = Math.max(1, photoUris.length);
    const chosen = pickRandom(MOCK_FOOD_CATALOGUE, count);

    const items: FoodRecognitionResultItem[] = chosen.map((entry) => {
      const confidence = 0.7 + Math.random() * 0.3;
      const expiryDate =
        entry.expiryType === 'none' ? null : addDays(todayISO(), entry.typicalShelfDays);

      // Occasionally simulate the model being unsure about something, so
      // the "Check this" correction UI has something real to show.
      const uncertain = Math.random() < 0.22;
      const item: FoodRecognitionResultItem = {
        name: entry.name,
        quantity: entry.quantity,
        unit: entry.unit,
        expiryDate,
        expiryType: entry.expiryType,
        category: entry.category,
        confidence: uncertain ? 0.4 + Math.random() * 0.2 : confidence,
      };

      if (uncertain) {
        if (Math.random() < 0.5 && expiryDate) {
          item.uncertainField = 'expiryDate';
          item.uncertainNote = "Nomeli couldn't read this expiry date clearly.";
        } else {
          item.uncertainField = 'name';
          item.uncertainNote = `Is this ${entry.name.toLowerCase()}?`;
        }
      }

      return item;
    });

    return { items };
  }
}

let instance: FoodRecognitionService | null = null;

export function getFoodRecognitionService(): FoodRecognitionService {
  if (!instance) instance = new MockFoodRecognitionService();
  return instance;
}
