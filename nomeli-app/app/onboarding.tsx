import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Avocado } from '../src/components/Avocado';
import { HandwrittenNote } from '../src/components/HandwrittenNote';
import { usePreferencesStore } from '../src/store/usePreferencesStore';
import { CookingConfidence, CookingTimePreference } from '../src/types';
import { color, radius, spacing, type } from '../src/theme/tokens';

function BackgroundBlob() {
  return (
    <Svg
      width="100%"
      height={220}
      viewBox="0 0 400 220"
      style={{ position: 'absolute', bottom: 0, left: 0 }}
      preserveAspectRatio="xMidYMax slice"
    >
      <Path
        d="M0 120C60 60 140 40 220 70C300 100 340 40 400 70V220H0Z"
        fill={color.sageSoft}
        opacity={0.6}
      />
    </Svg>
  );
}

type Step = 'welcome' | 'name' | 'people' | 'diet' | 'allergies' | 'dislikes' | 'cuisines' | 'confidence' | 'time';

const STEP_ORDER: Step[] = ['welcome', 'name', 'people', 'diet', 'allergies', 'dislikes', 'cuisines', 'confidence', 'time'];

const CONFIDENCE_OPTIONS: { value: CookingConfidence; label: string }[] = [
  { value: 'beginner', label: 'Still learning' },
  { value: 'confident', label: 'Confident' },
  { value: 'very_confident', label: 'Very confident' },
];

const TIME_OPTIONS: { value: CookingTimePreference; label: string }[] = [
  { value: 'under_15', label: 'Under 15 minutes' },
  { value: '15_30', label: '15–30 minutes' },
  { value: '30_60', label: '30–60 minutes' },
  { value: 'no_preference', label: "I don't mind" },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };
  return (
    <View>
      <View style={styles.tagRow}>
        {values.map((v) => (
          <Pressable key={v} onPress={() => onChange(values.filter((x) => x !== v))} style={styles.tag}>
            <Text style={styles.tagLabel}>{v} ✕</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        onBlur={add}
        placeholder={placeholder}
        placeholderTextColor={color.inkFaint}
        style={styles.input}
        returnKeyType="done"
      />
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const preferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEP_ORDER[stepIndex];

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (stepIndex === STEP_ORDER.length - 1) finish();
    else setStepIndex(stepIndex + 1);
  };
  const back = () => setStepIndex(Math.max(0, stepIndex - 1));

  return (
    <Screen contentStyle={styles.content}>
      {step !== 'welcome' && (
        <Pressable onPress={back} style={styles.backLink}>
          <Text style={styles.backLinkLabel}>Back</Text>
        </Pressable>
      )}

      {step === 'welcome' && (
        <View style={styles.welcome}>
          <View style={styles.mascotWrap}>
            <Avocado size={150} pose="wave" feet />
            <Text style={styles.heart}>❤️</Text>
          </View>
          <Text style={styles.wordmark}>nomeli</Text>
          <Text style={styles.tagline}>Your food, figured out.</Text>
          <Text style={styles.body}>
            Nomeli helps you use what you've got, plan meals around your life and stop good food going to waste.
          </Text>
          <View style={styles.ctaBlock}>
            <HandwrittenNote label="Let's get cooking!" curve="down-right" style={styles.ctaNote} />
            <Button
              label="Get Started"
              onPress={next}
              block
              trailingIcon={<Text style={styles.buttonArrow}>→</Text>}
            />
          </View>
          <Pressable onPress={finish} style={styles.loginLink}>
            <Text style={styles.loginLinkLabel}>
              Already have an account? <Text style={styles.loginLinkStrong}>Log in</Text>
            </Text>
          </Pressable>
          <BackgroundBlob />
        </View>
      )}

      {step === 'name' && (
        <View style={styles.step}>
          <Text style={styles.question}>What should Nomeli call you?</Text>
          <TextInput
            value={preferences.name}
            onChangeText={(v) => setPreferences({ name: v })}
            placeholder="Your name"
            placeholderTextColor={color.inkFaint}
            style={styles.input}
          />
        </View>
      )}

      {step === 'people' && (
        <View style={styles.step}>
          <Text style={styles.question}>How many people do you usually cook for?</Text>
          <View style={styles.tagRow}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} label={String(n)} active={preferences.peopleCount === n} onPress={() => setPreferences({ peopleCount: n })} />
            ))}
          </View>
        </View>
      )}

      {step === 'diet' && (
        <View style={styles.step}>
          <Text style={styles.question}>Any dietary preferences?</Text>
          <TagInput values={preferences.dietaryPreferences} onChange={(v) => setPreferences({ dietaryPreferences: v })} placeholder="e.g. Vegetarian, low-carb" />
        </View>
      )}

      {step === 'allergies' && (
        <View style={styles.step}>
          <Text style={styles.question}>Any allergies Nomeli should always avoid?</Text>
          <TagInput values={preferences.allergies} onChange={(v) => setPreferences({ allergies: v })} placeholder="e.g. Peanuts, shellfish" />
        </View>
      )}

      {step === 'dislikes' && (
        <View style={styles.step}>
          <Text style={styles.question}>Anything you'd rather Nomeli didn't suggest?</Text>
          <TagInput values={preferences.dislikedFoods} onChange={(v) => setPreferences({ dislikedFoods: v })} placeholder="e.g. Mushrooms, olives" />
        </View>
      )}

      {step === 'cuisines' && (
        <View style={styles.step}>
          <Text style={styles.question}>Favourite cuisines?</Text>
          <TagInput values={preferences.favouriteCuisines} onChange={(v) => setPreferences({ favouriteCuisines: v })} placeholder="e.g. Italian, Thai" />
        </View>
      )}

      {step === 'confidence' && (
        <View style={styles.step}>
          <Text style={styles.question}>How confident are you in the kitchen?</Text>
          <View style={styles.optionList}>
            {CONFIDENCE_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} active={preferences.cookingConfidence === opt.value} onPress={() => setPreferences({ cookingConfidence: opt.value })} />
            ))}
          </View>
        </View>
      )}

      {step === 'time' && (
        <View style={styles.step}>
          <Text style={styles.question}>How much time do you usually have to cook?</Text>
          <View style={styles.optionList}>
            {TIME_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} active={preferences.preferredCookingTime === opt.value} onPress={() => setPreferences({ preferredCookingTime: opt.value })} />
            ))}
          </View>
        </View>
      )}

      {step !== 'welcome' && (
        <View style={styles.footer}>
          <Button label={stepIndex === STEP_ORDER.length - 1 ? 'Finish' : 'Continue'} onPress={next} block />
          <Button label="Skip for now" variant="text" onPress={finish} block />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'flex-start', paddingTop: spacing.xl },
  backLink: { marginBottom: spacing.lg },
  backLinkLabel: { ...type.bodyMedium, color: color.avocadoDark },
  welcome: { flex: 1, alignItems: 'center', paddingTop: 24, gap: spacing.xs, position: 'relative', minHeight: 620 },
  mascotWrap: { position: 'relative', marginBottom: spacing.sm },
  heart: { position: 'absolute', top: -6, right: -18, fontSize: 22, color: color.urgentTomorrow },
  wordmark: { ...type.wordmark, color: color.avocadoDark },
  tagline: { ...type.body, color: color.inkDim, marginBottom: spacing.md },
  body: { ...type.body, color: color.ink, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 22, paddingHorizontal: spacing.sm },
  ctaBlock: { width: '100%', marginTop: 'auto', position: 'relative', zIndex: 2 },
  ctaNote: { position: 'absolute', right: 8, top: -40 },
  buttonArrow: { color: color.white, fontSize: 17, fontWeight: '700' },
  loginLink: { marginTop: spacing.lg, marginBottom: spacing.xs, zIndex: 2 },
  loginLinkLabel: { ...type.small, color: color.inkDim },
  loginLinkStrong: { color: color.avocadoDark, fontWeight: '700' },
  step: { gap: spacing.lg },
  question: { ...type.h1, color: color.ink, marginBottom: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: color.ink,
    backgroundColor: color.surface,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  tag: { backgroundColor: color.sageSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  tagLabel: { ...type.small, color: color.avocadoDark, fontWeight: '600' },
  chip: { borderWidth: 1.5, borderColor: color.line, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: color.surface },
  chipActive: { backgroundColor: color.avocadoDark, borderColor: color.avocadoDark },
  chipLabel: { ...type.bodyMedium, color: color.ink },
  chipLabelActive: { color: color.white },
  optionList: { gap: spacing.sm },
  footer: { marginTop: spacing.xxl, gap: spacing.xs },
});
