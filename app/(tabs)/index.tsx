/**
 * Home — Treasures-style alternating layout:
 *   - Signature hero verse (41:53)
 *   - 4 BIG full-width tiles (gold border, gradient tint, CTA bar)
 *   - 3 small-pair rows (2 tiles each) interleaved between the big tiles
 *   - Prayer times at the very bottom (per user request)
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrbitalBackdrop } from '../../src/components/OrbitalBackdrop';
import { PrayerTimesCard } from '../../src/components/PrayerTimesCard';
import { VerseAudioButton } from '../../src/components/VerseAudioButton';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { HelpButton } from '../../src/components/HelpButton';
import { AmbientToggle } from '../../src/components/AmbientToggle';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../../src/theme';

// Signature verse — Sūrat Fuṣṣilat 41:53
const HERO_VERSE = {
  key: '41:53',
  surah_en: 'Sūrat Fuṣṣilat',
  arabic: 'سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ',
  translation_en: 'We will show them Our signs in the horizons and within themselves until it becomes clear to them that it is al-Ḥaqq — the Truth.',
};

interface BigTileProps {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  ar: string;
  title: string;
  desc: string;
  badge: string;
  cta: string;
  gradient: [string, string, string];
}

function BigTile({ onPress, icon, iconTint, ar, title, desc, badge, cta, gradient }: BigTileProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.bigTile, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bigTileGradient}
      >
        <View style={styles.bigTileTop}>
          <View style={[styles.bigTileIcon, { borderColor: iconTint, backgroundColor: iconTint + '22' }]}>
            <Ionicons name={icon} size={28} color={iconTint} />
          </View>
          <View style={styles.bigTileBadge}>
            <Text style={styles.bigTileBadgeText}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.bigTileAr}>{ar}</Text>
        <Text style={styles.bigTileTitle}>{title}</Text>
        <Text style={styles.bigTileDesc}>{desc}</Text>
        <View style={styles.bigTileCta}>
          <Ionicons name="arrow-forward-circle" size={18} color={colors.gold} />
          <Text style={styles.bigTileCtaText}>{cta}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

interface SmallTileProps {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  ar: string;
  title: string;
  desc: string;
  badge?: string;
}

function SmallTile({ onPress, icon, iconTint, ar, title, desc, badge }: SmallTileProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallTile, pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] }]}>
      <LinearGradient
        colors={['#143027', '#0E1F1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.smallTileGradient}
      >
        <View style={styles.smallTileTop}>
          <View style={[styles.smallTileIcon, { borderColor: iconTint + '88', backgroundColor: iconTint + '22' }]}>
            <Ionicons name={icon} size={22} color={iconTint} />
          </View>
          {badge ? (
            <View style={styles.smallTileBadge}><Text style={styles.smallTileBadgeText}>{badge}</Text></View>
          ) : null}
        </View>
        <Text style={styles.smallTileAr} numberOfLines={1}>{ar}</Text>
        <Text style={styles.smallTileTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.smallTileDesc} numberOfLines={2}>{desc}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';

  const today = new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : lang === 'ur' ? 'ur-PK' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  const onShare = async () => {
    const body = `${HERO_VERSE.arabic}\n\n— Qur'ān ${HERO_VERSE.key}  ·  ${HERO_VERSE.surah_en}\n\n"${HERO_VERSE.translation_en}"\n\nFrom: Qur'ān, Bible & Science 📖`;
    try { await Share.share({ message: body }); } catch {}
  };

  // i18n helper — pick the right string per current language
  const L = (en: string, ar: string, ur: string) => (lang === 'ar' ? ar : lang === 'ur' ? ur : en);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <OrbitalBackdrop />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Top row — language switcher in centre, stream-water toggle right */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingBottom: 4, gap: spacing.sm }}>
          <LanguageSwitcher compact />
          <AmbientToggle size={34} />
        </View>
        {/* APP NAME LOCKUP */}
        <View style={styles.lockupWrap}>
          <Text style={styles.lockupKicker}>﷽</Text>
          <Text style={styles.lockupTitle}>{t('appName', lang)}</Text>
          <Text style={styles.lockupDsm}>by Divine Series Mobile (DSM)</Text>
          <Text style={styles.lockupSub}>{today}</Text>
          <View style={styles.lockupHairline} />
        </View>

        {/* SIGNATURE VERSE 41:53 HERO */}
        <LinearGradient
          colors={['#1d4a3d', colors.gold + '55', '#0e1f1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroInner}>
            <View style={[styles.heroChip, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="star" size={11} color={colors.gold} />
              <Text style={styles.heroChipTxt}>
                {L('OUR SIGNATURE VERSE', 'آية التطبيق', 'ایپ کی آیت')}  ·  {HERO_VERSE.surah_en}  {HERO_VERSE.key}
              </Text>
            </View>
            <Text style={styles.arabic}>{HERO_VERSE.arabic}</Text>
            <View style={styles.heroDivider} />
            <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>
              “{HERO_VERSE.translation_en}”
            </Text>
            <View style={[styles.heroActions, rtl && { flexDirection: 'row-reverse' }]}>
              <Pressable
                onPress={() => router.push(`/verse/${encodeURIComponent(HERO_VERSE.key)}` as any)}
                style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="book" size={14} color={colors.bg} />
                <Text style={styles.heroBtnTxt}>{L('Open tafseer', 'افتح التفسير', 'تفسیر کھولیں')}</Text>
              </Pressable>
              <VerseAudioButton verseKey={HERO_VERSE.key} size="md" />
              <Pressable onPress={onShare} hitSlop={6} style={({ pressed }) => [styles.heroIconBtn, pressed && { opacity: 0.6 }]}>
                <Ionicons name="share-outline" size={18} color={colors.gold} />
              </Pressable>
            </View>
            <Text style={styles.qariNote}>
              {L('🎧 Recited by Shaykh Mishary Rashid al-‘Afāsy', '🎧 بصوت الشيخ مشاري راشد العفاسي', '🎧 شیخ مشاری راشد العفاسی کی تلاوت')}
            </Text>
          </View>
        </LinearGradient>

        {/* Section label */}
        <Text style={[styles.gridLabel, { textAlign: 'center' }]}>
          {L('⟡ EXPLORE THE SIGNS ⟡', '⟡ استكشف الآيات ⟡', '⟡ نشانیوں کو تلاش کریں ⟡')}
        </Text>

        {/* BIG · Our Aqeedah & Approach — tap-anytime disclaimer (gold, top spot) */}
        <BigTile
          onPress={() => router.push('/onboarding' as any)}
          icon="shield-checkmark"
          iconTint={colors.gold}
          ar="عقيدتنا ومنهجنا"
          title={L('Our Aqeedah & Approach', 'عقيدتنا ومنهجنا', 'ہمارا عقیدہ اور طریقہ')}
          desc={L(
            'Before you begin: our covenant with the Qurʾān and Sunnah. Qurʾān first · science as one possible interpretation · in accordance with the aqeedah of Ahl al-Sunnah wa\'l-Jamāʿah. Tap anytime to re-read.',
            'قبل أن تبدأ: عهدنا مع القرآن والسنة. القرآن أولاً · العلم كتفسير محتمل · وفق عقيدة أهل السنة والجماعة. اضغط في أي وقت لإعادة القراءة.',
            'شروع کرنے سے پہلے: قرآن و سنت کے ساتھ ہمارا عہد۔ قرآن اوّل · سائنس ایک ممکنہ تشریح · اہل السنہ والجماعہ کے عقیدہ کے مطابق۔ کسی بھی وقت دوبارہ پڑھنے کے لیے دبائیں۔'
          )}
          badge="AHL AL-SUNNAH"
          cta={L('Read our aqeedah', 'اقرأ عقيدتنا', 'ہمارا عقیدہ پڑھیں')}
          gradient={['rgba(212,175,55,0.32)', 'rgba(212,175,55,0.08)', 'rgba(14,31,26,0.0)']}
        />

        {/* BIG #1 · Ask the Sheikh AI */}
        <BigTile
          onPress={() => router.push('/(tabs)/sheikh' as any)}
          icon="sparkles"
          iconTint={colors.gold}
          ar="اِسْأَلِ الشَّيْخَ"
          title={L('Ask the Sheikh AI', 'اسأل الشيخ', 'شیخ سے پوچھیں')}
          desc={L(
            'Ask the Sheikh for the tafseer of any Qur’ānic verse — or ask for a Qur’ānic scientific verse on a topic (the sun, embryology, mountains, the cosmos…). Grounded in four classical tafāsīr (Ibn Kathīr · al-Saʿdī · al-Muyassar · al-Jalālayn) — every answer is cited verbatim. Voice input supported.',
            'اسأل الشيخ تفسير أي آية قرآنية — أو اطلب آية قرآنية علمية في موضوع ما (الشمس، الأجنّة، الجبال، الكون…). مبني على أربعة تفاسير كلاسيكية (ابن كثير، السعدي، الميسر، الجلالين) — كل إجابة باقتباس حرفي. يدعم الإدخال الصوتي.',
            'شیخ سے کسی بھی قرآنی آیت کی تفسیر پوچھیں — یا کسی موضوع (سورج، جنین، پہاڑ، کائنات…) پر قرآنی سائنسی آیت طلب کریں۔ چار کلاسیکی تفسیروں (ابن کثیر، سعدی، الميسر، الجلالين) پر مبنی۔ ہر جواب حوالہ جات کے ساتھ۔ آواز ان پٹ بھی۔'
          )}
          badge="TAFSEER · SCIENCE"
          cta={L('Ask the Sheikh', 'اسأل الشيخ', 'شیخ سے سوال کریں')}
          gradient={['rgba(212,175,55,0.28)', 'rgba(212,175,55,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* Small pair · Prophet Isa + Bookmarks */}
        <View style={styles.smallPair}>
          <SmallTile
            onPress={() => router.push('/bible-comparisons' as any)}
            icon="rose-outline"
            iconTint={colors.violetHi}
            ar="عيسى ﷺ في الإسلام"
            title={L('Prophet ʿĪsā ﷺ in Islam', 'الإسلام والمسيح ﷺ', 'اسلام اور مسیح ﷺ')}
            desc={L('Miraculous birth · raised · return', 'الولادة · الرفع · العودة', 'ولادت · معراج · واپسی')}
            badge="✦"
          />
          <SmallTile
            onPress={() => router.push('/bookmarks' as any)}
            icon="bookmark"
            iconTint={colors.silverHi}
            ar="المحفوظات"
            title={L('Bookmarks', 'المحفوظات', 'بُک مارکس')}
            desc={L('Saved verses, topics & scientists', 'محفوظاتك من كل قسم', 'محفوظات ہر سیکشن سے')}
          />
        </View>

        {/* BIG · Scientific Discoveries A–Z (promoted to BIG TILE per user request) */}
        <BigTile
          onPress={() => router.push('/(tabs)/atoz' as any)}
          icon="planet"
          iconTint={colors.cyanHi}
          ar="آيَاتُ الكَوْن"
          title={L('Scientific Discoveries A–Z', 'الاكتشافات العلمية للقرآن أ–ي', 'قرآنی سائنسی دریافتیں الف-ی')}
          desc={L(
            '44 Qur’ānic signs from the Big Bang (21:30) and the expanding universe (51:47), to the orbits, the geological barriers between fresh and salt water, the iron from the heavens, and the embryonic stages. Each entry pairs the verbatim Qur’ānic verse with its tafseer and the modern scientific finding it foretold.',
            '٤٤ آية قرآنية من الانفجار الكبير (٢١:٣٠) والكون المتمدد (٥١:٤٧)، إلى المدارات، والحواجز بين البحار، والحديد من السماء، ومراحل الجنين. كل مدخل يربط الآية بالتفسير وبالاكتشاف العلمي الحديث.',
            '۴۴ قرآنی آیات بِگ بینگ (۲۱:۳۰) سے کائنات کی پھیلاؤ (۵۱:۴۷) تک، مدار، سمندری حدود، آسمان سے لوہا، اور جنین کی منازل۔ ہر اندراج آیت، تفسیر اور جدید سائنس کو جوڑتا ہے۔'
          )}
          badge="44 SIGNS · A–Z"
          cta={L('Browse the Qur’ānic signs', 'تصفح الآيات الكونية', 'قرآنی نشانیاں دیکھیں')}
          gradient={['rgba(120,200,230,0.26)', 'rgba(120,200,230,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* Small pair · Muslim Scientists single */}
        <View style={styles.smallPair}>
          <SmallTile
            onPress={() => router.push('/(tabs)/scientists' as any)}
            icon="people"
            iconTint={colors.gold}
            ar="علماء المسلمين"
            title={L('Muslim Scientists', 'علماء المسلمين', 'مسلم سائنسدان')}
            desc={L('50 minds · past & modern', '٥٠ عقول · قديم وحديث', '۵۰ عقول · ماضی و حال')}
            badge="50"
          />
          <SmallTile
            onPress={() => router.push('/(tabs)/recite' as any)}
            icon="search-circle"
            iconTint={colors.roseHi}
            ar="بحث الآية"
            title={L('Browse all 6,236 verses', 'تصفح ٦٢٣٦ آية', 'تمام آیات تلاش')}
            desc={L('Type or recite — find any āyah', 'اكتب أو اقرأ — تجد أي آية', 'لکھیں یا پڑھیں')}
          />
        </View>

        {/* BIG #2 · Sunnah & Science — promoted to BIG TILE per user request */}
        <BigTile
          onPress={() => router.push('/(tabs)/atoz' as any)}
          icon="medical"
          iconTint={colors.emeraldHi}
          ar="السُّنَّةُ وَالعِلْم"
          title={L('Sunnah & Science', 'السنة والعلم', 'سنت اور سائنس')}
          desc={L(
            '40 prophetic teachings backed by modern research — from honey, black seed, miswāk and olive oil, to fasting, hijama (cupping), the right-side sleep posture, sneezing & yawning etiquette, the third-third-third rule of eating, and the sunan of nutrition. Each entry shows the authentic hadith verbatim alongside the contemporary scientific finding.',
            '٤٠ تعليمًا نبويًا أيّدها العلم الحديث — من العسل، الحبة السوداء، السواك وزيت الزيتون، إلى الصيام، الحجامة، النوم على الجانب الأيمن، وآداب العطاس والتثاؤب، وقاعدة الثلث الثلث الثلث، وسنن التغذية. كل مدخل يعرض الحديث الصحيح حرفياً مع الدليل العلمي المعاصر.',
            '۴۰ نبوی تعلیمات جدید تحقیق سے تصدیق شدہ — شہد، کلونجی، مسواک، زیتون کا تیل، روزہ، حجامہ، دائیں کروٹ پر سونا، چھینک و جمائی کے آداب، تہائی تہائی تہائی کا اصول، اور غذائی سنتیں۔ ہر اندراج میں صحیح حدیث حرفاً اور جدید سائنسی شواہد ساتھ موجود۔'
          )}
          badge="40 PROPHETIC"
          cta={L('Open the prophetic library', 'افتح المكتبة النبوية', 'نبوی لائبریری کھولیں')}
          gradient={['rgba(80,200,120,0.26)', 'rgba(80,200,120,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* BIG #3 · Qur'ān vs Bible — featured insights (kept big per user request) */}
        <BigTile
          onPress={() => router.push('/bible-comparisons' as any)}
          icon="library"
          iconTint={colors.amberHi}
          ar="القُرْآن وَالإِنْجِيل"
          title={L('Qur’ān vs Bible — 40 comparisons', 'القرآن مقابل الإنجيل — ٤٠ مقارنة', 'قرآن بمقابل بائبل — ۴۰ موازنے')}
          desc={L(
            'Side-by-side accounts of Ādam, Nūḥ, Mūsā, Ibrāhīm, Yūsuf, Hārūn, Dāwūd and ʿĪsā — what the Qur’ān corrects in the corrupted Bible — plus 4 special insights including the Gospel of Barnabas, biblical verses pointing to Prophet Muḥammad ﷺ, the Cain & Abel raven, and the Bible-vs-Islam record on slavery.',
            'مقارنات جنبًا إلى جنب لقصص آدم ونوح وموسى وإبراهيم ويوسف وهارون وداود وعيسى — ما يصححه القرآن، مع ٤ بصائر خاصة (إنجيل برنابا، آيات تشير إلى محمد ﷺ، غراب قابيل وهابيل، وموقفا الإسلام والكتاب من العبودية).',
            'آدم، نوح، موسیٰ، ابراہیم، یوسف، ہارون، داؤد اور عیسیٰ علیہم السلام کے قصے — قرآن کیا اصلاح کرتا ہے — بائبل میں محمد ﷺ کی پیش گوئیاں، انجیل برنابا، ہابیل و قابیل کا کوّا، اور غلامی پر اسلام و بائبل کا تقابل۔'
          )}
          badge="40 ACCOUNTS"
          cta={L('Compare scriptures', 'قارن النصوص', 'موازنہ دیکھیں')}
          gradient={['rgba(255,180,90,0.26)', 'rgba(255,180,90,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* BIG · Bible Contradictions — 40 sourced, opens with Q 4:82 + Q 15:9 */}
        <BigTile
          onPress={() => router.push('/bible-contradictions' as any)}
          icon="document-text"
          iconTint={colors.roseHi}
          ar="تَنَاقُضَاتُ الكِتَابِ المُقَدَّس"
          title={L('Bible Contradictions — 40 internal proofs', 'تناقضات الكتاب المقدّس — ٤٠ تناقضًا داخليًّا', 'بائبل کے تضادات — ۴۰ اندرونی شواہد')}
          desc={L(
            'Opens with the Qur’ānic challenge of al-Nisāʾ 4:82 and the guarantee of al-Ḥijr 15:9. Then 40 fact-based textual contradictions taken from Imām Ibn Ḥazm’s al-Faṣl — each cited verbatim to the Bible’s own chapter and verse. Presented respectfully; the contradictions exist within the Bible’s own pages.',
            'يفتتح بتحدّي القرآن في النساء ٤:٨٢ وضمان الحجر ١٥:٩. ثم ٤٠ تناقضًا نصّيًا من «الفصل» للإمام ابن حزم — كلّ منها موثَّق حرفيًّا إلى سفر وإصحاح وآية من الكتاب المقدّس نفسه.',
            'سورۃ النساء ۴:۸۲ کے قرآنی چیلنج اور الحجر ۱۵:۹ کی ضمانت سے شروع۔ پھر ۴۰ نصی تضادات امام ابن حزم کی «الفصل» سے — ہر ایک بائبل کے باب و آیت کے ساتھ سند کے ساتھ۔'
          )}
          badge="✦ NEW · 40 SOURCED"
          cta={L('Open the 40 contradictions', 'افتح التناقضات الـ٤٠', '۴۰ تضادات کھولیں')}
          gradient={['rgba(232,90,90,0.26)', 'rgba(232,90,90,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* HELP button — centre of page, contextually placed between hero
            content and the deep-dive tiles. Critical for Chinese-phone
            users (Xiaomi/Huawei/Oppo) whose stripped MIUI builds often
            have no preinstalled mail app. Tapping fires both a mailto:
            and a Sentry capture so we get push-notified instantly. */}
        <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
          <HelpButton context="home" />
        </View>

        {/* HERO TILES · 3 special studies pulled out of bible-comparisons to the home page */}
        <SmallTile
          onPress={() => router.push('/bible-comparisons?tile=paul-changed-jesus-teachings' as any)}
          icon="warning"
          iconTint={colors.amberHi}
          ar="كيف غيّر بولس تعاليم المسيح"
          title={L(
            'How Paul changed the message of ʿĪsā ﷺ',
            'كيف غيّر بولس تعاليم المسيح ﷺ',
            'پولس نے حضرت عیسٰی ﷺ کا پیغام کیسے بدلا'
          )}
          desc={L(
            'Saul of Tarsus never met Jesus — yet his epistles reshaped the original gospel of tawḥīd into trinitarianism. Sourced study.',
            'لم يلتقِ بولس الطرسوسي بعيسى ﷺ — لكنّ رسائله أعادت تشكيل إنجيل التوحيد إلى عقيدة التثليث.',
            'سؤل ترسوسی نے عیسی ﷺ سے کبھی ملاقات نہیں کی — مگر ان کی تحریروں نے توحید کے انجیل کو تثلیث میں بدل دیا۔'
          )}
          badge={L('STUDY', 'دراسة', 'مطالعہ')}
        />

        <SmallTile
          onPress={() => router.push('/bible-comparisons?tile=islam-on-jesus-and-mary' as any)}
          icon="rose"
          iconTint={colors.roseHi}
          ar="مكانة عيسى ومريم في الإسلام"
          title={L(
            'Islam’s reverence for ʿĪsā & Maryam ﷺ',
            'تعظيم الإسلام لعيسى ومريم عليهما السلام',
            'اسلام میں حضرت عیسٰی اور حضرت مریم ﷺ کا مقام'
          )}
          desc={L(
            'The Qur’ān mentions Maryam by name more than the New Testament does. Six āyāt, one full sūrah, total honour.',
            'يذكر القرآن مريم باسمها أكثر من العهد الجديد كله — سورة كاملة وآيات في تكريمها وتكريم عيسى عليه السلام.',
            'قرآن نے حضرت مریم کا نام نئے عہدنامہ سے زیادہ ذکر کیا ہے۔ ایک پوری سورت ان کے نام پر ہے۔'
          )}
          badge={L('REVERENCE', 'تكريم', 'تعظیم')}
        />

        <SmallTile
          onPress={() => router.push('/bible-comparisons?tile=barnabas-bible-turkey' as any)}
          icon="book"
          iconTint={colors.amberHi}
          ar="إنجيل برنابا — اكتُشف في تركيا"
          title={L(
            'The Gospel of Barnabas — Islamic teachings inside a Bible',
            'إنجيل برنابا — تعاليم إسلامية داخل إنجيل',
            'انجیل برنبا — بائبل کے اندر اسلامی تعلیمات'
          )}
          desc={L(
            'The 1500-year-old Aramaic manuscript discovered in Turkey: a gospel that affirms tawḥīd, predicts Muḥammad ﷺ by name, and rejects crucifixion.',
            'مخطوطة آرامية عمرها ١٥٠٠ عام في تركيا: إنجيل يؤكّد التوحيد، ويتنبّأ بمحمد ﷺ بالاسم، ويُنكر الصلب.',
            'ترکی میں ملنے والی ۱۵۰۰ سال پرانی آرامی نسخہ: ایک انجیل جو توحید کی تائید کرتی ہے، نام لے کر محمد ﷺ کی پیش گوئی کرتی ہے، اور صلیب کا انکار کرتی ہے۔'
          )}
          badge={L('DISCOVERY', 'اكتشاف', 'دریافت')}
        />

        {/* (Muslim Scientists + Bookmarks moved earlier — keep no duplicate small pair here) */}

        {/* BIG #4 · Qur'ānic Āyah Voice Search — clarified "how it works" */}
        <BigTile
          onPress={() => router.push('/(tabs)/recite' as any)}
          icon="mic"
          iconTint={colors.roseHi}
          ar="بَحْثُ الآيَة"
          title={L('Qur’ānic Āyah Voice Search', 'البحث الصوتي للآية', 'قرآنی آیت آواز تلاش')}
          desc={L(
            'How it works: tap the mic and read any Qur’ānic āyah aloud — even just a fragment of a verse you remember. Our system listens to your recitation and matches your voice instantly against all 6,236 āyāt of the Holy Qur’ān. The exact verse opens in one tap — with its tafseer, beautiful audio recitation by Shaykh Mishary al-‘Afāsy, and any scientific link.',
            'كيف يعمل: انقر على المايكروفون واقرأ أي آية قرآنية بصوتك — حتى ولو جزء صغير تذكره. يستمع النظام إلى تلاوتك ويقارنها فورًا بكل ٦٢٣٦ آية من القرآن الكريم. تُفتح الآية بضغطة واحدة — مع التفسير وتلاوة جميلة بصوت الشيخ مشاري العفاسي ورابطها العلمي.',
            'کیسے کام کرتا ہے: مائیک پر ٹیپ کریں اور کوئی بھی قرآنی آیت بلند آواز سے پڑھیں — یاد کا چھوٹا سا حصہ بھی کافی۔ ہمارا نظام آپ کی تلاوت سنتا اور قرآن کریم کی تمام ۶۲۳۶ آیات سے فوراً ملاتا ہے۔ ایک ٹیپ پر آیت کھل جاتی ہے — تفسیر، شیخ مشاری العفاسی کی خوبصورت تلاوت، اور سائنسی ربط کے ساتھ۔'
          )}
          badge="🎙 VOICE → VERSE"
          cta={L('Tap the mic & recite', 'انقر المايكروفون واقرأ', 'مائیک دبائیں اور پڑھیں')}
          gradient={['rgba(232,90,90,0.26)', 'rgba(232,90,90,0.05)', 'rgba(14,31,26,0.0)']}
        />

        {/* BIG #5 · Walking the Signs (closing CTA) */}
        <BigTile
          onPress={() => router.push('/about' as any)}
          icon="heart"
          iconTint={colors.roseHi}
          ar="الْمَسِيرُ مَعَ الآيَاتِ"
          title={L('Walking with the Signs', 'المسير مع الآيات', 'نشانیوں کے ساتھ سفر')}
          desc={L(
            'The story behind this app — built by Divine Series Mobile to bridge classical scholarship and modern science. Includes attribution to the Qaris, scholars and saintly figures whose works light every screen.',
            'قصة هذا التطبيق — مبني من Divine Series Mobile لربط العلم الكلاسيكي بالعلم الحديث. مع شكر للقراء والعلماء والأولياء.',
            'یہ ایپ کیسے بنا — Divine Series Mobile کا مقصد کلاسیکی علم اور جدید سائنس کو جوڑنا — اور قراء، علماء اور اولیاء کا شکریہ۔'
          )}
          badge="ABOUT · DSM"
          cta={L('Read the story', 'اقرأ القصة', 'کہانی پڑھیں')}
          gradient={['rgba(232,90,90,0.22)', 'rgba(232,90,90,0.04)', 'rgba(14,31,26,0.0)']}
        />

        {/* Prayer Times — moved to BOTTOM per user request */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[styles.gridLabel, { textAlign: 'center', marginBottom: spacing.sm }]}>
            {L('⟡ TODAY’S SALĀH TIMINGS ⟡', '⟡ مواقيت الصلاة اليوم ⟡', '⟡ آج کے نماز کے اوقات ⟡')}
          </Text>
          <PrayerTimesCard />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  lockupWrap: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, gap: 2 },
  lockupKicker: { fontSize: 24, color: colors.gold, letterSpacing: 1 },
  lockupTitle: { ...ty.h1, color: colors.gold, fontSize: 22, letterSpacing: 1, fontWeight: '800', textAlign: 'center', textShadowColor: colors.gold + '55', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  lockupDsm: { ...ty.tiny, color: colors.goldHi, marginTop: 2, fontWeight: '600', letterSpacing: 1, fontStyle: 'italic' },
  lockupSub: { ...ty.tiny, color: colors.silverDim, marginTop: 4 },
  lockupHairline: { width: 80, height: 1, backgroundColor: colors.gold + '66', marginTop: spacing.sm },

  // Hero verse card
  hero: { borderRadius: radius.xl, margin: spacing.lg, padding: 2, overflow: 'hidden' },
  heroInner: { backgroundColor: colors.bg + 'F2', borderRadius: radius.xl - 2, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.gold + '44' },
  heroChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold + '88', backgroundColor: colors.gold + '18' },
  heroChipTxt: { ...ty.label, color: colors.gold, fontSize: 10 },
  arabic: { ...ty.arabicLarge, color: colors.parchment, textAlign: 'right', marginTop: 4, fontSize: 24, lineHeight: 44 },
  heroDivider: { height: 1, backgroundColor: colors.gold + '44', marginVertical: 4 },
  translation: { ...ty.bodyLarge, color: colors.text, fontStyle: 'italic', lineHeight: 24 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.gold, flex: 1, justifyContent: 'center' },
  heroBtnTxt: { ...ty.small, color: colors.bg, fontWeight: '800' },
  heroIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.gold + '55' },
  qariNote: { ...ty.tiny, color: colors.silverDim, marginTop: 8, textAlign: 'center' },

  gridLabel: { ...ty.label, color: colors.gold, fontSize: 11, marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 3 },

  // BIG tile (Treasures-style hero card, full width)
  bigTile: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  bigTileGradient: { padding: spacing.lg },
  bigTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  bigTileIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  bigTileBadge: { backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bigTileBadgeText: { color: colors.bg, fontWeight: '800', fontSize: 9.5, letterSpacing: 1.0 },
  bigTileAr: { fontSize: 22, color: colors.gold, marginTop: spacing.xs, fontWeight: '700', textAlign: 'right' },
  bigTileTitle: { color: colors.parchment, fontSize: 20, marginTop: 6, lineHeight: 26, fontWeight: '800' },
  bigTileDesc: { color: colors.textDim, marginTop: spacing.sm, lineHeight: 20, fontSize: 13.5 },
  bigTileCta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gold + '40' },
  bigTileCtaText: { color: colors.gold, fontWeight: '700', fontSize: 13 },

  // small-pair row
  smallPair: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  smallTile: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold + '55',
  },
  smallTileGradient: { padding: spacing.md, minHeight: 150, gap: 4, justifyContent: 'space-between' },
  smallTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallTileIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  smallTileBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: colors.gold + '55', backgroundColor: colors.bg + 'CC' },
  smallTileBadgeText: { color: colors.gold, fontWeight: '800', fontSize: 10.5 },
  smallTileAr: { fontSize: 14, color: colors.gold, marginTop: 6, fontWeight: '600', textAlign: 'right' },
  smallTileTitle: { color: colors.parchment, fontSize: 14, fontWeight: '800', lineHeight: 18, marginTop: 2 },
  smallTileDesc: { color: colors.textDim, fontSize: 11, lineHeight: 14 },
});
