/**
 * Unlock screen — paywall preview (IAP wiring TBD).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { SilverButton } from '../src/components/SilverButton';
import { useApp } from '../src/store/useApp';
import { useStorePurchases, reportPurchaseToBackend } from '../src/iap/iap';
import { IAP_PRODUCTS, AI_PACK_CREDITS, AI_PACK_FALLBACK_PRICES, type IapProductSku } from '../src/iap/products';
import { getEntitlement } from '../src/api';
import { openSupportEmail } from '../src/support';
import { t } from '../src/i18n/strings';
import { colors, spacing, type as ty } from '../src/theme';

export default function Unlock() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const setEntitlement = useApp((s) => s.setEntitlement);
  const rtl = lang === 'ar' || lang === 'ur';
  const store = useStorePurchases();

  const buyLifetime = async () => {
    if (!store.available) {
      Alert.alert(
        'In-app purchase',
        lang === 'en'
          ? 'IAP runs only in the App Store / Play Store build. In Expo Go / web preview the purchase flow is disabled — tap "Preview unlocked mode" below for testing.'
          : lang === 'ar'
            ? 'الشراء داخل التطبيق يعمل فقط في إصدار المتجر. للمعاينة، اضغط معاينة الفتح.'
            : 'IAP صرف اسٹور بلڈ میں چلتا ہے۔ پیش نظارے کے لیے "Preview unlocked mode" دبائیں۔',
      );
      return;
    }
    try {
      await store.requestPurchase({
        request: {
          apple: { sku: IAP_PRODUCTS.lifetimeUnlock },
          google: { skus: [IAP_PRODUCTS.lifetimeUnlock] },
        },
      });
    } catch (e) {
      console.warn('[IAP] requestPurchase failed', e);
    }
  };

  const buyPack = async (sku: IapProductSku) => {
    if (!store.available) {
      Alert.alert('IAP', lang === 'en' ? 'Available in store builds only.' : 'متاح في إصدار المتجر فقط.');
      return;
    }
    try {
      await store.requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
      });
    } catch (e) {
      console.warn('[IAP] pack requestPurchase failed', e);
    }
  };

  // Helper: live price (from store) or fallback string for a consumable SKU.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceOf = (sku: string) => store.products?.find((p: any) => p.productId === sku)?.localizedPrice
    || AI_PACK_FALLBACK_PRICES[sku] || '£—';

  const restore = async () => {
    if (!store.available) {
      Alert.alert('IAP', lang === 'en' ? 'Available in store builds only.' : 'متاح في إصدار المتجر فقط.');
      return;
    }
    try {
      const restored = await store.restorePurchases();
      // On iOS, react-native-iap returns restored transactions here but does
      // NOT re-fire onPurchaseSuccess for them. We must manually inspect the
      // array and unlock accordingly. On Android it also works.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lifetimePurchases = (Array.isArray(restored) ? restored : []).filter((p: any) =>
        p?.productId === IAP_PRODUCTS.lifetimeUnlock ||
        p?.sku === IAP_PRODUCTS.lifetimeUnlock ||
        p?.productIds?.includes?.(IAP_PRODUCTS.lifetimeUnlock)
      );
      const hasLifetime = lifetimePurchases.length > 0;
      if (hasLifetime) {
        // Report each restored purchase to backend so server-side
        // entitlement (AI Sheikh, cloud tafseer quotas, etc.) is unlocked
        // too — this is how the /api/iap/entitlements/{deviceId} check
        // flips to unlocked=true on the server for this device.
        const deviceId = useApp.getState().deviceId || 'preview';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Promise.all(lifetimePurchases.map((p: any) =>
          reportPurchaseToBackend(deviceId, {
            productId: IAP_PRODUCTS.lifetimeUnlock,
            transactionId: p?.transactionId || p?.originalTransactionId || p?.orderId || null,
            purchaseToken: p?.purchaseToken || null,
            receiptData: p?.transactionReceipt || p?.originalTransactionDateIOS || null,
            raw: p,
          })
        ));
        setEntitlement({ unlocked: true });
        Alert.alert(
          lang === 'en' ? 'Restored ✓' : lang === 'ar' ? 'تمت الاستعادة ✓' : 'بحال ہو گیا ✓',
          lang === 'en' ? 'Your lifetime unlock has been restored. Enjoy full tafseer + Ask the Sheikh.' :
          lang === 'ar' ? 'تمت استعادة اشتراكك مدى الحياة. استمتع بكامل التفسير و«اسأل الشيخ».' :
          'تاحیات انلاک بحال ہو گیا۔ مکمل تفسیر اور "شیخ سے پوچھیں" سے فائدہ اٹھائیں۔'
        );
        setTimeout(() => router.back(), 800);
      } else {
        // Apple / Google returned zero restored purchases. This can happen
        // when (a) the £0.99 charge is still in Apple's "pending" state
        // (receipt not yet finalised), (b) the user is signed in with a
        // different Apple ID than the one that purchased, or (c) the user
        // never actually completed a purchase. Before we tell them "no
        // purchases found", do a SERVER-SIDE fallback check: our backend
        // may already have received the receipt via a prior in-flight
        // report-purchase call, in which case we can unlock this device
        // anyway.
        let serverUnlocked = false;
        try {
          const deviceId = useApp.getState().deviceId || 'preview';
          const resp: any = await getEntitlement(deviceId);
          const ent = resp && typeof resp === 'object' && 'data' in resp ? resp.data : resp;
          if (ent && ent.unlocked === true) serverUnlocked = true;
        } catch { /* server offline — fall through to the "no purchases" message */ }

        if (serverUnlocked) {
          setEntitlement({ unlocked: true });
          Alert.alert(
            lang === 'en' ? 'Unlocked ✓' : lang === 'ar' ? 'تم الفتح ✓' : 'انلاک ہو گیا ✓',
            lang === 'en' ? 'Your lifetime unlock was found on our server and re-applied to this device.' :
            lang === 'ar' ? 'تم العثور على شرائك مدى الحياة على خادمنا وتم إعادة تفعيله على هذا الجهاز.' :
            'ہمارے سرور پر آپ کا تاحیات انلاک ملا اور اس ڈیوائس پر بحال کر دیا گیا۔'
          );
          setTimeout(() => router.back(), 800);
          return;
        }

        Alert.alert(
          lang === 'en' ? "We couldn't find your purchase" :
            lang === 'ar' ? 'لم نعثر على شرائك' :
            'ہمیں آپ کی خریداری نہیں ملی',
          lang === 'en'
            ? `Apple returned no purchases tied to this Apple ID.\n\nTwo quick checks:\n• Are you signed in with the SAME Apple ID you paid with? (Settings → your name → Media & Purchases)\n• Open Settings → your name → Purchase History and confirm the £0.99 charge is there and cleared\n\nIf both look right, tap "Email us" below and we'll unlock your device manually within a few hours.`
            : lang === 'ar'
              ? `لم تُعِد Apple أي شراء مرتبط بحساب Apple هذا.\n\nفحصان سريعان:\n• هل سجّلت الدخول بنفس حساب Apple الذي دفعت به؟ (الإعدادات ← اسمك ← الوسائط والمشتريات)\n• افتح الإعدادات ← اسمك ← سجل الشراء وأكد وجود دفعة ٠٫٩٩.\n\nإن كان كلاهما صحيحًا، اضغط «راسِلنا» وسنفتح جهازك يدويًا خلال ساعات.`
              : `Apple نے اس Apple ID سے وابستہ کوئی خریداری واپس نہیں کی۔\n\nدو فوری چیک:\n• کیا آپ اسی Apple ID سے سائن ان ہیں جس سے ادائگی کی؟ (Settings → آپ کا نام → Media & Purchases)\n• Settings → آپ کا نام → Purchase History کھول کر تصدیق کریں کہ £0.99 وہاں ہے۔\n\nاگر دونوں ٹھیک ہیں تو "ای میل کریں" دبائیں، ہم چند گھنٹوں میں دستی طور پر ان لاک کر دیں گے۔`,
          [
            { text: lang === 'en' ? 'Close' : lang === 'ar' ? 'إغلاق' : 'بند کریں', style: 'cancel' },
            {
              text: lang === 'en' ? 'Email us' : lang === 'ar' ? 'راسِلنا' : 'ای میل کریں',
              onPress: () => openSupportEmail({
                deviceId: useApp.getState().deviceId || 'preview',
                topic: 'unlock',
                message: `Hi — I paid £0.99 for the lifetime unlock but Restore Purchases isn't finding it on my Apple ID. Please could you unlock my device manually? (Apple returned ${restored?.length ?? 0} transactions.)`,
              }),
            },
          ]
        );
      }
    } catch (e: any) {
      console.warn('[IAP] restore failed', e);
      Alert.alert(
        lang === 'en' ? 'Restore failed' : lang === 'ar' ? 'فشلت الاستعادة' : 'بحالی ناکام',
        e?.message || String(e)
      );
    }
  };

  // Price tags from store when available, otherwise fallback to £0.99
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lifetimeProduct = store.products?.find((p: any) => p.productId === IAP_PRODUCTS.lifetimeUnlock);
  const lifetimePrice = lifetimeProduct?.localizedPrice || '£0.99';

  const Bullet = ({ text }: { text: string }) => (
    <View style={[styles.bullet, rtl && { flexDirection: 'row-reverse' }]}>
      <Ionicons name="checkmark-circle" size={18} color={colors.silver} />
      <Text style={[styles.bulletText, { textAlign: rtl ? 'right' : 'left' }]}>{text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.bgElevated, colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.silver} />
        </Pressable>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={36} color={colors.silver} />
          </View>
          <Text style={styles.heroTitle}>{t('unlockTitle', lang)}</Text>
          <Text style={[styles.heroSubtitle, { textAlign: 'center' }]}>{t('unlockBody', lang)}</Text>
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.includedLabel}>{lang === 'en' ? "WHAT'S INCLUDED" : lang === 'ar' ? 'ما المشمول' : 'کیا شامل ہے'}</Text>
          <Bullet text={lang === 'en' ? 'Unlock all 50+ A–Z scientific verses' : lang === 'ar' ? 'فتح جميع آيات العلم' : 'A–Z کی تمام آیات'} />
          <Bullet text={lang === 'en' ? '50 full Muslim Scientist biographies' : lang === 'ar' ? 'خمسون ترجمة' : '۵۰ سوانح عمریاں'} />
          <Bullet text={lang === 'en' ? 'Daily Sign with deep-dive history' : lang === 'ar' ? 'علامة اليوم بالتفصيل' : 'تفصیلی روزانہ نشانی'} />
          <Bullet text={lang === 'en' ? '3 free AI Sheikh questions every week' : lang === 'ar' ? 'ثلاثة أسئلة للشيخ أسبوعيًّا' : 'ہفتے میں ۳ مفت شیخ سوال'} />
          <Bullet text={lang === 'en' ? 'Lifetime access — no subscription' : lang === 'ar' ? 'مدى الحياة — دون اشتراك' : 'تاحیات، بغیر سبسکرپشن'} />
        </Card>

        <SilverButton
          label={`${t('unlockTitle', lang)} — ${lifetimePrice}`}
          onPress={buyLifetime}
          icon={<Ionicons name="lock-open" size={20} color={colors.bg} />}
          fullWidth
        />

        <Pressable onPress={restore} hitSlop={6}>
          <Text style={styles.restoreLink}>
            {lang === 'en' ? 'Restore previous purchases' :
             lang === 'ar' ? 'استعادة مشتريات سابقة' :
             'پچھلی خریداریاں بحال کریں'}
          </Text>
        </Pressable>

        {/* ── AI Sheikh top-up pack — 3 consumable tiers (mirrors Treasures) ── */}
        <Card>
          <Text style={styles.packHead}>
            {lang === 'en' ? 'AI SHEIKH — TOP-UP QUESTIONS' :
             lang === 'ar' ? 'الشيخ الذكي — أسئلة إضافية' :
             'AI شیخ — اضافی سوالات'}
          </Text>
          <Text style={styles.packSub}>
            {lang === 'en' ? 'Run out of your weekly 3 free questions? Top up here. Consumable, no subscription.' :
             lang === 'ar' ? 'انتهت أسئلتك الثلاثة المجانية؟ أضف باقة هنا. شراء واحد فقط، دون اشتراك.' :
             'ہفتے کے ۳ مفت سوالات ختم؟ یہاں ٹاپ اپ کریں۔ ایک بار خریداری، کوئی سبسکرپشن نہیں۔'}
          </Text>

          {[IAP_PRODUCTS.aiPack1, IAP_PRODUCTS.aiPack10, IAP_PRODUCTS.aiPack30].map((sku) => {
            const credits = AI_PACK_CREDITS[sku] || 0;
            const price = priceOf(sku);
            const bestValue = sku === IAP_PRODUCTS.aiPack10;
            const tierLabel =
              lang === 'en' ? `${credits} question${credits > 1 ? 's' : ''}` :
              lang === 'ar' ? `${credits} سؤال${credits > 1 ? '' : ''}` :
              `${credits} سوال${credits > 1 ? '' : ''}`;
            return (
              <Pressable
                key={sku}
                onPress={() => buyPack(sku)}
                style={({ pressed }) => [
                  styles.tierBtn,
                  bestValue && styles.tierBtnBest,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={[styles.tierLeft, rtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={bestValue ? colors.gold : colors.silver} />
                  <Text style={[styles.tierLabel, bestValue && { color: colors.gold }]}>{tierLabel}</Text>
                  {bestValue && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueTxt}>
                        {lang === 'en' ? 'BEST VALUE' : lang === 'ar' ? 'الأفضل' : 'بہترین'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tierPrice, bestValue && { color: colors.gold }]}>{price}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Text style={[styles.fine, { textAlign: rtl ? 'right' : 'center' }]}>
          {lang === 'en' ? 'Payment is processed by Apple / Google. A one-time charge of £0.99 (or local equivalent) applies. No subscription.' :
            lang === 'ar' ? 'تسديدٌ لمرّة واحدة عبر Apple / Google. دون اشتراكات.' :
            'Apple / Google کے ذریعے ایک بار کی ادائگی۔ کوئی سبسکرپشن نہیں۔'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.cardHi, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.silver + '55', marginBottom: spacing.md },
  heroTitle: { ...ty.display, color: colors.silverHi, marginTop: 4 },
  heroSubtitle: { ...ty.body, color: colors.textDim, marginTop: spacing.sm, maxWidth: 340, lineHeight: 22 },
  includedLabel: { ...ty.label, color: colors.silverDim, marginBottom: spacing.md, fontSize: 11 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bulletText: { ...ty.body, color: colors.text, flex: 1, fontSize: 14.5 },
  previewLink: { textAlign: 'center', color: colors.silverDim, marginTop: 6, ...ty.small, textDecorationLine: 'underline' },
  restoreLink: { textAlign: 'center', color: colors.silver, marginTop: 6, ...ty.small, fontWeight: '600' },
  packHead: { ...ty.label, color: colors.gold, marginBottom: 4, fontSize: 11, letterSpacing: 1.5 },
  packSub: { ...ty.tiny, color: colors.textDim, marginBottom: spacing.md, lineHeight: 17 },
  tierBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.silver + '33', marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tierBtnBest: { borderColor: colors.gold + '99', backgroundColor: colors.gold + '11' },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  tierLabel: { ...ty.body, color: colors.silver, fontWeight: '600' },
  bestValueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.gold, marginLeft: 6 },
  bestValueTxt: { color: colors.bg, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tierPrice: { ...ty.body, color: colors.silver, fontWeight: '700' },
  fine: { ...ty.tiny, color: colors.textMuted, marginTop: spacing.md, paddingHorizontal: spacing.md, lineHeight: 15 },
});
