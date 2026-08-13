/**
 * About / Dedications / Charity / Share — App #3.
 * Mirrors the warm, keepsake tone of the Treasures app About page.
 */
import { Ionicons } from '@expo/vector-icons';
import { t } from '../src/i18n/strings';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useApp } from '../src/store/useApp';
import { colors, radius, spacing, type as ty } from '../src/theme';

const SHARE_MESSAGE =
  `Assalāmu ʿalaykum 🌙\n\n` +
  `I've been using "Qur'ān, Bible and Science" — part of Divine Series Mobile (DSM) — inspired by the works and teachings of my late beloved spiritual sheikh, Hadrat Shaykh ʿAbdur Raḥīm Naqshbandī Chakwālī (Raḥmatullāhi ʿalayhi), and by my late teacher Shaykh Wājid Ḥussain Deobandī (Raḥmatullāhi ʿalayhi) — who first opened my eyes to the comparative study of Christianity and the sciences, and through whom I studied Ṣaḥīḥ Muslim and Tafsīr al-Jalālayn.\n\n` +
  `• 44 Qur'ānic verses with classical tafseer + modern science\n` +
  `• 40 Sunnah practices backed by peer-reviewed research\n` +
  `• 40 Qur'ān-vs-Bible corrective accounts + 4 featured insights (incl. the Prophet ﷺ foretold in the Bible, the Gospel of Barnabas in Turkey, Saul of Tarsus, and Islam's reverence for ʿĪsā & Maryam)\n` +
  `• 40 Bible Contradictions cited verbatim to chapter & verse — opening with Qur'ān 4:82 and 15:9\n` +
  `• 50 Muslim scientists past & modern (incl. Dr Maurice Bucaille)\n` +
  `• Voice-recite verse search · AI Sheikh with citations · audio recitation by Shaykh Mishary al-ʿAfāsy\n\n` +
  `One-time £0.99 Lifetime Unlock — no ads, no subscriptions.\n\n` +
  `JazākumAllāhu khayran. 🤲`;

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';

  const onShare = () => router.push('/share' as any);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={lang === 'en' ? 'About & Dedications' : lang === 'ar' ? 'عن التطبيق والإهداءات' : 'تعارف اور تشکر'}
        subtitle={lang === 'en' ? 'Charity · share · acknowledgements' : ''}
        showBack
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>

        {/* CHARITY 10% — the binding covenant of Divine Series Mobile */}
        <Card accent={colors.gold}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="heart" size={20} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.gold }]}>10% CHARITY COVENANT</Text>
          </View>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? "10% of all net proceeds from this app are donated to Ummah Welfare Trust (UK Charity No. 1000851) for emergency Muslim relief worldwide. This covenant binds every app in Divine Series Mobile (DSM)."
              : lang === 'ar'
              ? "يُتبرَّع بـ ١٠٪ من صافي ريع التطبيق لمؤسسة Ummah Welfare Trust (الجمعية الخيرية البريطانية رقم 1000851) لإغاثة المسلمين في أنحاء العالم. عهدٌ يلزم كل تطبيقات Divine Series Mobile."
              : "اس ایپ کے کل خالص آمدنی کا 10% Ummah Welfare Trust (UK چیریٹی نمبر 1000851) کو دیا جاتا ہے۔ یہ Divine Series Mobile کی ہر ایپ پر لازم ہے۔"}
          </Text>
        </Card>

        {/* SHARE — viral loop */}
        <Pressable onPress={onShare} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Card accent={colors.emerald}>
            <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="share-social" size={20} color={colors.emerald} />
              <Text style={[styles.cardTitle, { color: colors.emerald, flex: 1 }]}>
                {lang === 'en' ? 'SHARE / RECOMMEND' : lang === 'ar' ? 'شارك التطبيق' : 'ایپ شیئر کریں'}
              </Text>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
            </View>
            <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>
              {lang === 'en' ? 'Spread the benefit — one tap shares the app.' : lang === 'ar' ? 'انشر المنفعة — مشاركة بضغطة.' : 'فائدہ پھیلائیں — ایک ٹیپ سے شیئر۔'}
            </Text>
          </Card>
        </Pressable>

        {/* FATHER DEDICATION */}
        <Card accent={colors.rose}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="rose" size={18} color={colors.rose} />
            <Text style={[styles.cardTitle, { color: colors.rose }]}>{t('a3_about_forMyBelovedFather') || 'FOR MY BELOVED FATHER'}</Text>
          </View>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_muhammadAmin') || 'Muhammad Amin'}</Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en' ? '(Raḥmatullāhi ʿalayhi)' : lang === 'ar' ? '(رَحِمَهُ الله)' : '(رَحِمَهُ اللہ)'}
          </Text>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>{t('a3_about_mahmoodTarajia') || 'Mahmood Tarajia'}</Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? '(Raḥmatullāhi ʿalayhi — my beloved father-in-law)'
              : lang === 'ar'
              ? '(رَحِمَهُ الله — والد زوجتي الحبيب)'
              : '(رَحِمَهُ اللہ — میرے محبوب سسر)'}
          </Text>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>
            {lang === 'en'
              ? "Please keep them in your duʿās. May Allāh ﷻ grant them the highest of Jannah."
              : lang === 'ar'
              ? 'نرجو دعاءكم لهما. جعلهما الله في أعلى جنّاته.'
              : 'براہ کرم دونوں کو اپنی دعاؤں میں یاد رکھیں۔ اللہ ﷻ انہیں جنت الفردوس کا اعلیٰ مقام عطا فرمائے۔'}
          </Text>
        </Card>

        {/* SHEIKHS */}
        <Card accent={colors.violet}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="moon" size={18} color={colors.violet} />
            <Text style={[styles.cardTitle, { color: colors.violet }]}>{t('a3_about_spiritualMashIkh') || 'SPIRITUAL MASHĀʾIKH'}</Text>
          </View>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_hadratShaykhAbdurRaMNaqshband') || 'Hadrat Shaykh ʿAbdur Raḥīm Naqshbandī'}</Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_chakwLRecentlyPassedRaMatull') || 'Chakwāl · recently passed (Raḥmatullāhi ʿalayhi)'}</Text>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>{t('a3_about_hadratShaykhZulfiqRAMad') || 'Hadrat Shaykh Zulfiqār Aḥmad Naqshbandī'}</Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en' ? '(Raḥmatullāhi ʿalayhi)' : lang === 'ar' ? '(رَحِمَهُ الله)' : '(رَحِمَهُ اللہ)'}
          </Text>
        </Card>

        {/* USTAD WHO INSPIRED THIS APP'S MISSION */}
        <Card accent={colors.gold}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="library" size={18} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.gold }]}>
              {lang === 'en'
                ? 'THE TEACHER WHO INSPIRED THIS APP'
                : lang === 'ar'
                ? 'الأستاذ الذي ألهم هذا التطبيق'
                : 'وہ استاد جنہوں نے یہ ایپ کا تصوّر دیا'}
            </Text>
          </View>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left' }]}>
            Shaykh Wājid Ḥussain Deobandī
          </Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en' ? '(Raḥmatullāhi ʿalayhi)' : lang === 'ar' ? '(رَحِمَهُ الله)' : '(رَحِمَهُ اللہ)'}
          </Text>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>
            {lang === 'en'
              ? "My beloved late teacher under whom I studied Ṣaḥīḥ Muslim and Tafsīr al-Jalālayn. It was he who first opened my eyes to the comparative study of Christianity and the wonders of science within the Qur'ān — the seed from which this entire app grew. May Allāh ﷻ raise his rank in al-Firdaws al-Aʿlā, accept his teaching as ṣadaqah jāriyah, and reunite us with him under the shade of His ʿArsh."
              : lang === 'ar'
              ? "أستاذي الحبيب المرحوم الذي قرأتُ عليه «صحيح مسلم» و«تفسير الجلالين». هو أوّل من فتح بصري لدراسة النصرانية المقارنة وعجائب العلوم في القرآن — البذرة التي نبت منها هذا التطبيق كلّه. رفع الله درجاته في الفردوس الأعلى، وجعل تعليمه صدقةً جاريةً، وجمعنا به تحت ظلّ عرشه."
              : "میرے محبوب مرحوم استاد جن سے میں نے «صحیح مسلم» اور «تفسیر الجلالین» پڑھی۔ آپ ہی نے سب سے پہلے میری نظر عیسائیت کے تقابلی مطالعہ اور قرآن میں موجود سائنسی عجائب کی طرف کھولی — یہی وہ بیج تھا جس سے یہ پوری ایپ پروان چڑھی۔ اللہ ﷻ آپ کا درجہ فردوسِ اعلی میں بلند فرمائے، آپ کی تعلیم کو صدقہ جاریہ بنائے، اور ہمیں آپ کے ساتھ اپنے عرش کے سائے میں جمع فرمائے۔"}
          </Text>
        </Card>

        {/* ASATIZAH */}
        <Card accent={colors.amber}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="school" size={18} color={colors.amber} />
            <Text style={[styles.cardTitle, { color: colors.amber }]}>{t('a3_about_myTeachersAsTidhah') || 'MY TEACHERS · ASĀTIDHAH'}</Text>
          </View>
          <Text style={[styles.subhead, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_belovedUstDAfiAhullH') || 'Beloved Ustād (ḥafiẓahullāh)'}</Text>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_hadratMuftAMadKhNp') || 'Hadrat Muftī Aḥmad Khānpūrī'}</Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>{t('a3_about_jMiAIslMiyyahTa') || 'Jāmiʿa Islāmiyyah Taʿlīmuddīn, Dhabel'}</Text>

          <Text style={[styles.subhead, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.md }]}>{t('a3_about_passedRaMatullHiAlayhim') || 'Passed (Raḥmatullāhi ʿalayhim)'}</Text>
          {['Shaykh Ikrām ʿAlī','Mawlānā Yūsuf Kāwī','Mawlānā Rashīd Ṣāḥib','Mawlānā Ibrāhīm Kāwī'].map((n) => (
            <Text key={n} style={[styles.li, { textAlign: rtl ? 'right' : 'left' }]}>•  {n}</Text>
          ))}
          <Text style={[styles.subhead, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.md }]}>{t('a3_about_livingAfiAhumAllH') || 'Living (ḥafiẓahum-Allāh)'}</Text>
          {['Muftī ʿAbdul Qayyūm','Mawlānā Ismāʿīl Chāswī','Mawlānā Ilyās Ṣāḥib','Muftī ʿUbaidullāh','Muftī Abū Bakr','Qāḍī Ḥifẓul Raḥmān','Muftī Maḥmūd','Muftī ʿAbbās','Qārī Shabbīr','Qārī Yūsuf','Mawlānā ʿUthmān'].map((n) => (
            <Text key={n} style={[styles.li, { textAlign: rtl ? 'right' : 'left' }]}>•  {n}</Text>
          ))}
        </Card>

        {/* DEVELOPER */}
        <Card accent={colors.silver}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="information-circle" size={20} color={colors.silver} />
            <Text style={[styles.cardTitle, { color: colors.silver }]}>
              {lang === 'en' ? 'DEVELOPER' : lang === 'ar' ? 'المطوّر' : 'ڈویلپر'}
            </Text>
          </View>
          <Text style={[styles.dedicationName, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? 'Mawlānā Zubair Apabhai'
              : lang === 'ar'
              ? 'مولانا زبير أبابهاي'
              : 'مولانا زبیر آپا بھائی'}
          </Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? 'B.Sc (Hons) · TESOL · TEFL'
              : lang === 'ar'
              ? 'بكالوريوس علوم (مع مرتبة الشرف) · تيسول · تيفل'
              : 'B.Sc (Hons) · TESOL · TEFL'}
          </Text>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? 'Graduate of Jāmiʿah Islāmiyyah Taʿleemuddīn, Dhabel'
              : lang === 'ar'
              ? 'خرّيج الجامعة الإسلامية تعليم الدين بضابيل'
              : 'فاضل جامعہ اسلامیہ تعلیم الدین، ڈابھیل'}
          </Text>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>
            {lang === 'en'
              ? 'Divine Series Mobile (DSM)\nCoventry, United Kingdom'
              : lang === 'ar'
              ? 'Divine Series Mobile (DSM)\nكوفنتري، المملكة المتحدة'
              : 'Divine Series Mobile (DSM)\nکوونٹری، برطانیہ'}
          </Text>
          <Pressable onPress={() => Linking.openURL('mailto:zubbes@yahoo.co.uk')} hitSlop={6}>
            <Text style={styles.link}>zubbes@yahoo.co.uk</Text>
          </Pressable>
          <Text style={[styles.italic, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>{t('a3_about_sisterAppsTreasuresOfTheSacred') || 'Sister apps: Treasures of the Sacred Qurʾān · Interpretation of Dreams'}</Text>
        </Card>

        {/* AI DISCLAIMER */}
        <Card accent={colors.rose}>
          <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="warning" size={18} color={colors.rose} />
            <Text style={[styles.cardTitle, { color: colors.rose }]}>{t('a3_about_aiDisclaimer') || 'AI DISCLAIMER'}</Text>
          </View>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>
            {lang === 'en'
              ? 'The Ask-the-Sheikh AI is a study aid only. It is grounded in four classical Sunnī tafāsīr (Ibn Kathīr, al-Saʿdī, al-Muyassar, al-Jalālayn), cites verbatim, and appends a clear disclaimer in your selected language. It is NEVER a substitute for a qualified living scholar. For any serious matter, please consult a qualified human ʿālim. Allāhu aʿlam.'
              : lang === 'ar'
              ? 'إنّ ذكاء «اسأل الشيخ» أداةُ دراسةٍ فقط. مُرتكِزٌ على أربعة تفاسير سنّية كلاسيكية (ابن كثير، السعدي، الميسّر، الجلالين)، ويستشهد حرفيًّا، ويُلحق تنبيهًا واضحًا بلغتك المختارة. وهو ليس بديلًا أبدًا عن عالِمٍ حيٍّ مُؤهَّل. في أيّ أمرٍ جادٍّ يرجى استشارة عالِمٍ بشريٍّ مُؤهَّل. والله أعلم.'
              : 'Ask-the-Sheikh AI صرف مطالعے کا معاون ہے۔ یہ چار کلاسیکی سنّی تفاسیر (ابن کثیر، السعدی، المیسّر، الجلالین) پر مبنی ہے، حوالہ لفظ بہ لفظ دیتا ہے، اور آپ کی منتخب زبان میں واضح ڈسکلیمر ساتھ لگاتا ہے۔ یہ کسی مستند زندہ عالم کا متبادل ہرگز نہیں۔ کسی بھی سنجیدہ مسئلے کے لیے براہِ کرم کسی مستند زندہ عالم سے رجوع کیجیے۔ واللہ اعلم۔'}
          </Text>
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  cardTitle: { ...ty.label, fontSize: 12 },
  body: { ...ty.body, color: colors.text, lineHeight: 22 },
  italic: { ...ty.small, color: colors.textDim, fontStyle: 'italic' },
  dedicationName: { ...ty.bodyLarge, color: colors.silverHi, fontWeight: '700' },
  subhead: { ...ty.label, color: colors.silverDim, fontSize: 11, marginBottom: 4 },
  li: { ...ty.small, color: colors.textDim, lineHeight: 21 },
  link: { ...ty.body, color: colors.gold, textDecorationLine: 'underline', marginTop: 4 },
});
