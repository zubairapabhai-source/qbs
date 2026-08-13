/**
 * Settings — language + about (modal).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { useApp } from '../src/store/useApp';
import { t } from '../src/i18n/strings';
import { colors, spacing, type as ty } from '../src/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.silver} />
        </Pressable>
        <Text style={styles.title}>{t('settings', lang)}</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        <Card>
          <Text style={styles.label}>{t('language', lang).toUpperCase()}</Text>
          <LanguageSwitcher />
        </Card>

        <Pressable onPress={() => router.push('/onboarding' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card accent={colors.gold}>
            <View style={[styles.rowItem, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en' ? 'Our Aqeedah & Approach' : lang === 'ar' ? 'عقيدتنا ومنهجنا' : 'ہمارا عقیدہ اور طریقہ'}
                </Text>
                <Text style={[styles.rowSub, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en'
                    ? 'Qurʾān first · science as interpretation · Ahl al-Sunnah wa\'l-Jamāʿah'
                    : lang === 'ar'
                    ? 'القرآن أولاً · العلم كتفسير · أهل السنة والجماعة'
                    : 'قرآن اوّل · سائنس ایک تشریح · اہل السنہ والجماعہ'}
                </Text>
              </View>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/bookmarks' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card accent={colors.silver}>
            <View style={[styles.rowItem, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.silver} />
              <Text style={[styles.rowText, { flex: 1, textAlign: rtl ? 'right' : 'left' }]}>{t('bookmarks', lang)}</Text>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/bible-comparisons' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card accent={colors.rose}>
            <View style={[styles.rowItem, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="library-outline" size={20} color={colors.rose} />
              <Text style={[styles.rowText, { flex: 1, textAlign: rtl ? 'right' : 'left' }]}>
                {lang === 'en' ? 'Qur’ān vs Bible' : lang === 'ar' ? 'القرآن مقابل الإنجيل' : 'قرآن بمقابل انجیل'}
              </Text>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/about' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card accent={colors.gold}>
            <View style={[styles.rowItem, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="heart-outline" size={20} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en' ? 'About & Dedications' : lang === 'ar' ? 'عن التطبيق والإهداءات' : 'تعارف اور تشکر'}
                </Text>
                <Text style={[styles.rowSub, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en'
                    ? 'Charity covenant · my father · spiritual sheikhs · Ustād Wājid Ḥussain Deobandī (raḥ.) · all asātidhah'
                    : lang === 'ar'
                    ? 'العهد الخيري · والدي · المشايخ الروحانيون · أستاذي الشيخ واجد حسين الديوبندي (رح) · جميع الأساتذة'
                    : 'صدقہ کا عہد · والد · روحانی مشایخ · استاد واجد حسین دیوبندی (رح) · تمام اساتذہ'}
                </Text>
              </View>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/share' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card accent={colors.emerald}>
            <View style={[styles.rowItem, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="qr-code-outline" size={20} color={colors.emerald} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en' ? 'Refer a friend · Share' : lang === 'ar' ? 'أوصِ صديقًا · شارك' : 'دوست کو تجویز کریں · شیئر'}
                </Text>
                <Text style={[styles.rowSub, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en'
                    ? 'QR card · share image · pre-written message'
                    : lang === 'ar'
                    ? 'رمز الاستجابة · بطاقة صورة · رسالة جاهزة'
                    : 'QR کارڈ · کارڈ کی تصویر · پہلے سے لکھا پیغام'}
                </Text>
              </View>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomColor: colors.divider, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...ty.h2, color: colors.text },
  label: { ...ty.label, color: colors.silverDim, marginBottom: spacing.md, fontSize: 11 },
  body: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { ...ty.bodyLarge, color: colors.text, fontWeight: '600' },
  rowSub: { ...ty.tiny, color: colors.textDim, marginTop: 2, lineHeight: 17 },
});
