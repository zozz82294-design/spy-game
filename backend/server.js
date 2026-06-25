const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { pingTimeout: 120000, pingInterval: 25000 });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.get('/health', (req, res) => res.status(200).send('OK'));

let rooms = {};

// 🔥 بنك ألغاز تخمين الكلمة العملاق (بدون تكرار وبدون كلمات تافهة)
const rebusPuzzlesDB = [
    { category: "أداة", clue: "م + 🪚 + ة", answer: "منشارة" },
    { category: "حيوان", clue: "س + 🐢", answer: "سلحفاة" },
    { category: "موقع تواصل", clue: "فيس + 📖", answer: "فيسبوك" },
    { category: "موقع تواصل", clue: "يو + 🧪", answer: "يوتيوب" },
    { category: "جهاز", clue: "تلف + 👁️ + ون", answer: "تلفزيون" },
    { category: "مواصلات", clue: "ميكرو + 🚌", answer: "ميكروباص" },
    { category: "أكلة", clue: "مكر + 🏃‍♂️ + ة", answer: "مكرونة" },
    { category: "حيوان", clue: "عنك + 👢", answer: "عنكبوت" },
    { category: "حيوان", clue: "سن + 🚪", answer: "سنجاب" },
    { category: "جهاز", clue: "م + 👻 + ة", answer: "مروحة" },
    { category: "طعام", clue: "كات + 🪵", answer: "كاتشب" },
    { category: "أداة", clue: "دب + 👩 + ة", answer: "دباسة" },
    { category: "أداة حمام", clue: "صا + 🦉 + ة", answer: "صابونة" },
    { category: "ديكور", clue: "نا + 🐀 + ة", answer: "نافورة" },
    { category: "دولة", clue: "فلس + 🧱", answer: "فلسطين" },
    { category: "مدينة", clue: "من + 🖼️ + ة", answer: "منصورة" },
    { category: "شكل هندسي", clue: "مس + 🐘", answer: "مستطيل" },
    { category: "لعبة", clue: "بلي + 🌍 + و", answer: "بلياردو" },
    { category: "رياضة", clue: "ك + 🐀 + يه", answer: "كاراتيه" },
    { category: "جهاز", clue: "كم + 🏠 + تر", answer: "كمبيوتر" },
    { category: "جهاز", clue: "ميكرو + 📱", answer: "ميكروفون" },
    { category: "طعام", clue: "بان + 🍰", answer: "بان كيك" },
    { category: "مستحضرات", clue: "شام + 👻", answer: "شامبو" },
    { category: "فاكهة", clue: "أنا + 👩", answer: "أناناس" },
    { category: "ملابس", clue: "بن + 🎨 + ون", answer: "بنطلون" },
    { category: "شيء", clue: "ش + 🌂", answer: "شمسية" },
    { category: "مكان", clue: "مس + 🎭", answer: "مسرح" },
    { category: "مركبة بحرية", clue: "غ + 🏜️ + ة", answer: "غواصة" },
    { category: "أداة", clue: "ش + 🔨", answer: "شاكوش" },
    { category: "طعام", clue: "مرب + 🍵", answer: "مربى" },
    { category: "طعام", clue: "حل + 🏃‍♂️ + ة", answer: "حلاوة" },
    { category: "حلوى", clue: "بسب + 💋 + ة", answer: "بسبوسة" },
    { category: "أداة", clue: "م + 👁️ + ة", answer: "مكواة" },
    { category: "جهاز", clue: "س + ⏰ + ة", answer: "سماعة" },
    { category: "دولة", clue: "ص + 🐉", answer: "صين" },
    { category: "دولة", clue: "ي + 🚪 + ن", answer: "يابان" },
    { category: "دولة", clue: "ألم + 👧 + يا", answer: "ألمانيا" },
    { category: "مشروب", clue: "نس + ☕", answer: "نسكافيه" },
    { category: "طعام", clue: "مايو + 👃", answer: "مايونيز" },
    { category: "تطبيق", clue: "واتس + ⬆️", answer: "واتساب" },
    { category: "تطبيق", clue: "تيك + 🗣️", answer: "تيكتوك" },
    { category: "حلوى", clue: "شوكو + ❌ + ة", answer: "شوكولاتة" },
    { category: "طعام", clue: "سان + 🚿", answer: "ساندوتش" },
    { category: "مكان", clue: "صي + 🍉 + ة", answer: "صيدلية" },
    { category: "طائر", clue: "عص + 💡", answer: "عصفور" },
    { category: "أداة", clue: "م + 🗝️", answer: "مفتاح" },
    { category: "فاكهة", clue: "بر + 🍊", answer: "برتقال" },
    { category: "مكان", clue: "م + 🏫", answer: "مدرسة" },
    { category: "رياضة", clue: "ك + ⚽", answer: "كورة" },
    { category: "أثاث", clue: "ك + 🪑", answer: "كرسي" },
    { category: "حيوان", clue: "ز + 🦒", answer: "زرافة" },
    { category: "ملابس", clue: "ق + 👔", answer: "قميص" },
    { category: "أداة", clue: "ن + 👓", answer: "نظارة" },
    { category: "طعام", clue: "ج + 🧀", answer: "جبنة" },
    { category: "أداة", clue: "م + ☂️", answer: "مظلة" },
    { category: "أداة", clue: "م + 🧹", answer: "مقشة" },
    { category: "أداة", clue: "م + 🪞", answer: "مراية" },
    { category: "حيوان", clue: "ق + 🐒", answer: "قرد" },
    { category: "حيوان", clue: "ذ + 🐺", answer: "ذئب" },
    { category: "طائر", clue: "ن + 🦅", answer: "نسر" },
    { category: "طائر", clue: "ح + 🕊️", answer: "حمامة" },
    { category: "حشرة", clue: "ف + 🦋", answer: "فراشة" },
    { category: "مكان", clue: "س + 🛒", answer: "سوق" },
    { category: "مكان", clue: "م + 🏭", answer: "مصنع" },
    { category: "مهنة", clue: "ط + 👨‍🍳", answer: "طباخ" },
    { category: "مهنة", clue: "م + 👨‍🏫", answer: "مدرس" },
    { category: "مهنة", clue: "م + 👨‍🔧", answer: "ميكانيكي" },
    { category: "وسيلة نقل", clue: "س + 🚢", answer: "سفينة" },
    { category: "أداة", clue: "م + 🔬", answer: "ميكروسكوب" },
    { category: "أداة", clue: "ت + 🔭", answer: "تلسكوب" },
    { category: "آلة موسيقية", clue: "ج + 🎸", answer: "جيتار" },
    { category: "آلة موسيقية", clue: "ب + 🎹", answer: "بيانو" },
    { category: "أداة", clue: "ب + 🧭", answer: "بوصلة" },
    { category: "شيء", clue: "ص + 🚀", answer: "صاروخ" },
    { category: "لعبة", clue: "ط + 🪁", answer: "طيارة ورق" },
    { category: "أداة", clue: "م + 🔫", answer: "مسدس ميه" },
    { category: "شيء", clue: "ب + 🎈", answer: "بالونة" }
];

const categorizedWords = { "حاجات جوا وبرا البيت": ["سرير", "مخدة", "بطانية", "دولاب", "شماعة", "مراية", "سجادة", "ستارة", "نجفة", "لمبة", "فيشة", "مفتاح كهرباء", "باب", "شباك", "بلكونة", "ريموت", "تلفزيون", "كنبة", "كرسي", "طاولة", "مكتب", "ساعة حائط", "فازة", "وردة", "صورة", "مروحة", "تكييف", "دفاية", "غسالة", "ثلاجة", "بوتاجاز", "فرن", "ميكروويف", "خلاط", "كاتل", "حنفية", "حوض", "صابونة", "فوطة", "ليفة", "شامبو", "معجون أسنان", "فرشاة أسنان", "مشط", "مقص أظافر", "استشوار", "مكواة", "مكنسة", "ممسحة", "مقشة", "جاروف", "زبالة", "كيس", "علبة", "صندوق", "درج", "قفل", "شنطة", "محفظة", "نظارة", "شاحن", "سماعة", "لاب توب", "تابلت", "كيبورد", "ماوس", "سلك", "كرتونة", "مسمار", "شاكوش", "مفك", "بنسة", "غراء", "شريط لحام", "بطارية", "ولاعة", "شمعة", "كبريت", "مبخرة", "سبحة", "سجادة صلاة", "مصحف", "قلم", "ورقة", "دباسة", "استيكة", "براية", "مسطرة", "لون", "لوحة", "ملف", "تقويم", "نوتة", "منبه", "حصالة", "ميزان", "طفاية حريق", "عمود نور", "إشارة مرور", "رصيف", "يافطة", "صندوق زبالة", "كشك", "نافورة", "تمثال", "سور", "بوابة", "عتبة", "بلاط", "أسفلت", "طوبة", "زلطة", "يافطة محل", "كابينة تليفون", "مطب", "كوبري مشاة", "نفق", "جراج", "بدروم", "روف", "خزان مياه", "دش", "بانيو", "بيديه", "سخان", "شفاط", "انبوبة", "ولاعة غاز", "فنجان", "طبق", "معلقة", "شوكة", "سكينة", "كوباية", "دورق", "براد", "صينية", "مطبقية", "قطاعة", "مصفاة", "طشت", "جردل", "خرطوم", "بوابة عمارة", "يافطة دكتور", "يافطة صيدلية", "شجرة في الشارع", "عربية راكنة", "موتوسيكل راكن", "توكتوك", "ميكروباص", "كشك سجاير", "فرشة فاكهة", "عربية فول", "عربية كبدة", "فرن عيش", "محل بقالة", "سوبر ماركت", "حلاق", "مكوجي", "مغسلة"], "أكل وشرب": ["أرز", "مكرونة", "عيش", "بيض", "جبنة", "لبن", "زبادي", "عسل", "حلاوة", "مربى", "زيت", "سمنة", "زبدة", "ملح", "سكر", "فلفل", "كمون", "شطة", "كاتشب", "مايونيز", "بطاطس", "طماطم", "خيار", "بصل", "ثوم", "جزر", "فلفل رومي", "بتنجان", "كوسة", "بسلة", "فاصوليا", "عدس", "فول", "طعمية", "كشري", "حواوشي", "بيتزا", "برجر", "شاورما", "كباب", "كفتة", "فراخ", "لحمة", "سمك", "تونة", "كبدة", "شوربة", "سلطة", "مخلل", "شيبسي", "لبان", "بونبوني", "شوكولاتة", "بسكويت", "كيكة", "ايس كريم", "كنافة", "بسبوسة", "فاكهة", "تفاح", "موز", "برتقال", "عنب", "بطيخ", "مانجو", "فراولة", "خوخ", "رمان", "كمثرى", "جوافة", "تمر", "تين", "مشمش", "أناناس", "كيوي", "كانز", "مياه", "شاي", "قهوة", "عصير", "بيبسي", "كوكاكولا", "سفن اب", "ميرندا", "عصير قصب", "تمر هندي", "سوبيا", "لبن رايب", "ينسون", "نعناع", "قرفة", "كاكاو", "نسكافيه", "كابتشينو", "شاي بلبن", "سحلب", "خروب", "كريب", "فطير", "بان كيك", "وافل", "دوناتس", "جيلي", "مارشميلو", "غزل البنات", "لب", "سوداني", "فستق", "لوز", "بندق", "كاجو", "عين جمل", "بقسماط", "شابورة", "كرواسون", "باتيه", "سميط", "فايش", "ملوخية", "سبانخ", "قلقاس", "محشي", "ورق عنب", "كرنب", "ممبار", "بامية", "قرنبيط", "بروكلي", "مشروم", "ليمون", "اسبريسو", "موكا", "لاتيه", "شاي أخضر", "قهوة تركي", "قهوة عربي", "عصير مانجو", "عصير فراولة", "عصير تفاح", "سردين", "جمبري", "كابوريا", "استاكوزا", "سبيط", "سم بلطي", "سمك بوري", "لحمة مفرومة", "سجق", "سوسيس", "بسطرمة", "لانشون", "رومي مدخن", "جبنة رومي", "جبنة بيضا", "جبنة نستو", "جبنة قديمة", "مية معدنية", "مية غازية", "شويبس", "فيروز", "عصير قمر الدين", "عصير برتقال", "عصير ليمون", "زبادو", "ميلك شيك", "فرابيتشينو", "سموزي"], "أدوات وأشياء": ["سكينة", "شوكة", "معلقة", "طبق", "كوباية", "فنجان", "براد", "حلة", "طاسة", "صينية", "مبشرة", "مقشرة", "مصفاة", "هراسة", "مغرفة", "هون", "لبانة", "كنكة", "طقم توابل", "برطمان", "ترمس", "طرشي", "زمزمية", "لانش بوكس", "شنطة سفر", "كوتشي", "صندل", "شبشب", "شراب", "قميص", "بنطلون", "تيشيرت", "بلوفر", "جاكيت", "بالطو", "بدلة", "فستان", "طرحة", "جيبة", "بيجامة", "جلاليبة", "عباية", "كاب", "برنيطة", "جوانتي", "كوفية", "حزام", "كرافتة", "ساعة يد", "خاتم", "غويشة", "سلسلة", "حلق", "توكة", "بنسة شعر", "بروش", "ميدالية", "شمسية", "علم", "خريطة", "بوصلة", "تلسكوب", "ميكروسكوب", "كاميرا", "ميكروفون", "بيانو", "جيتار", "طبلة", "كمانجة", "ناي", "قانون", "سماعة دي جي", "مروحة ايد", "ريشة", "كرة قدم", "كرة سلة", "مضرب تنس", "طاولة بينج بونج", "شطرنج", "دومينو", "كوتشينة", "سلم وتعبان", "لودو", "طيارة ورق", "مرجيحة", "زحليقة", "مسدس ميه", "بالونة", "صاروخ", "عروسة لعبة", "دبدوب", "عجلة", "سكوتر", "نظارة شمس", "نظارة نظر", "عدسات", "محلول", "قطرة", "بلاستر", "شاش", "قطن", "سرنجة", "ترمومتر", "خيط", "إبرة", "مقص", "مازورة", "متر", "فرشاة صبغ", "رولة", "جردل", "خرطوم", "سلم خشب", "منشار", "شنيور", "صاروخ كهربائي", "مسمار قلاووظ", "صامولة", "وردة مسمار", "أزميل", "مبرد", "مشرط", "مفك صليبة", "مفك عادة", "كماشة", "قطاعة سلك", "شريط قياس", "ميزان ميه", "كوريك", "مفتاح انجليزي", "مفتاح فرنساوي", "قلم رصاص", "قلم جاف", "قلم سبورة", "قلم فلوماستر", "كراسة", "كشكول", "كتاب", "مجلد", "دوسيه", "خراطة", "استيكة", "كوريكتور", "صمغ", "سلوتيب", "استيك", "دبوس مكتب", "دبوس طرحة"], "أماكن ومواصلات": ["جامع", "كنيسة", "مستشفى", "صيدلية", "مدرسة", "حضانة", "جامعة", "سنتر", "مكتبة", "محل", "سوبر ماركت", "مول", "مطعم", "كافيه", "ورشة", "بنك", "بنزينة", "قسم شرطة", "مطافي", "سجن", "محكمة", "سفارة", "قصر", "فيلا", "عمارة", "شقة", "فندق", "سينما", "مسرح", "كباريه", "سيرك", "ملاهي", "حديقة", "جنينة", "غابة", "صحراء", "شاطئ", "بحر", "نهر", "بحيرة", "جبل", "كهف", "شارع", "كوبري", "نفق", "محطة", "رصيف", "مطار", "ميناء", "مركب", "سفينة", "لنش", "يخت", "قارب", "غواصة", "طيارة", "هليكوبتر", "سيارة", "تاكسي", "ميكروباص", "اتوبيس", "مترو", "قطار", "ترام", "توكتوك", "موتوسيكل", "فيسبا", "عجلة", "سكوتر", "لودر", "ونش", "عربية اسعاف", "عربية مطافي", "بوكس شرطة", "دبابة", "مخبز", "مغسلة", "كوافير", "صالون حلاقة", "صالة جيم", "نادي", "استاد", "ملعب", "حمام سباحة", "متحف", "معرض", "عيادة", "معمل تحاليل", "شركة", "مصنع", "مخزن", "سوق", "جزارة", "مسمط", "مقلة", "عطارة", "مكتب بريد", "سنترال", "شهر عقاري", "مرور", "سجل مدني", "طيارة ورق", "بالون طائر", "تلفريك", "حصان", "عربية كارو", "عربية نقل", "تريلا", "عربية نص نقل", "توك توك", "موتوسيكل صيني", "بيتش باجي", "جيت سكي", "بدال", "عوامة", "موقف اتوبيسات", "محطة قطر", "محطة مترو", "صالة وصول", "برج مراقبة", "منارة", "جزر", "واحة", "وادي", "شلال", "بركان", "خيمة", "عشة", "كوخ", "قبة", "ميدان", "دوران", "تقاطع", "حارة", "زقاق"], "حيوانات ونباتات": ["أسد", "نمر", "فهد", "ذئب", "ثعلب", "كلب", "قطة", "فار", "أرنب", "قرد", "نسناس", "فيل", "زرافة", "حصان", "حمار", "جمل", "بقرة", "جاموسة", "خروف", "معزة", "خنزير", "غزال", "دب", "باندا", "كنغر", "كوالا", "تمساح", "ثعبان", "سحلية", "برص", "سلحفاة", "ضفدع", "سمكة", "قرش", "حوت", "دولفين", "أخطبوط", "قنديل بحر", "استاكوزا", "كابوريا", "نحلة", "نملة", "دبانة", "ناموسة", "صرصار", "عنكبوت", "عقرب", "فراشة", "غراب", "حمامة", "عصفور", "صقر", "نسر", "بومة", "ببغاء", "بطة", "وزة", "فرخة", "ديك", "ديك رومي", "نعامة", "بطريق", "شجرة", "نخلة", "صبار", "نجيلة", "غصن", "ورقة شجر", "ليمونة", "برتقالة", "بذرة", "قنفذ", "خفاش", "سنجاب", "حرباء", "دودة", "يرقة", "خنفساء", "جرادة", "جعل", "دبور", "فرس النهر", "وحيد القرن", "فقمة", "حصان البحر", "نجم البحر", "محار", "جمبري", "سبيط", "طاووس", "نورس", "بجعة", "لقلق", "نعناع", "ريحان", "بقدونس", "كزبرة", "شبت", "كرفس", "جرجير", "خس", "فجل", "صبارة", "وردة بلدي", "فل", "ياسمين", "نرجس", "عباد الشمس", "قرنفل", "توليب", "بصلة", "فص ثوم", "جدر", "ساق", "لحاء", "ثمرة", "زهرة", "شجيرة", "سوسة", "برغوت", "قملة", "قراد", "بق", "خنزير غينيا", "دب قطبي", "بطريق", "فقمة", "كلب بحر", "سيد قشطة", "حمار وحشي", "غوريلا", "شمبانزي", "طحالب", "عشب", "نبات ظل"], "مهن ووظائف": ["دكتور", "مهندس", "مدرس", "ضابط", "محامي", "قاضي", "طيار", "ممرضة", "صيدلي", "نجار", "سباك", "كهربائي", "حداد", "جزار", "خباز", "حلاق", "كوافير", "محاسب", "مدير", "سكرتير", "صحفي", "مذيع", "ممثل", "مغني", "رسام", "كاتب", "عالم", "فلاح", "سواق", "بواب", "حارس", "طباخ", "جرسون", "عامل", "ميكانيكي", "صياد", "مفتش", "طبيب أسنان", "دكتور بيطري", "طبيب عيون", "جراح", "مسعف", "مهندس معماري", "مهندس ديكور", "مهندس كمبيوتر", "مبرمج", "مصمم", "مصور", "مونتير", "مخرج", "مؤلف", "شاعر", "ملحن", "موزع", "عازف", "راقص", "لاعب كورة", "مدرب", "حكم", "رئيس", "وزير", "محافظ", "عمدة", "ظابط شرطة", "ضابط جيش", "عسكري", "عريف", "شاويش", "محقق", "مخبر", "سباك صحي", "نقاش", "مبيض محارة", "بنا", "صنايعي", "مقاول", "سواق تاكسي", "سواق ميكروباص", "سواق قطر", "سواق طيارة", "كابتن بحري", "بحار", "غطاس", "مضيفة طيران", "مندوب مبيعات", "كاشير", "بياع", "صاحب محل", "تاجر", "مستورد", "جواهرجي", "سايس", "قهوجي", "جزمجي", "خياط", "ترزي", "منجد", "فني تكييف", "فني ألوميتال", "عامل نظافة", "زبال", "ساعي بريد", "طيار دليفري", "أمين مخزن", "بودي جارد", "كابتن جيم", "دكتور نفسي", "أخصائي تغذية", "فني أشعة", "كيميائي", "فيزيائي"], "رياضة وهوايات": ["كرة قدم", "كرة سلة", "كرة طائرة", "تنس", "تنس طاولة", "اسكواش", "سباحة", "غوص", "جري", "مشي", "عجل", "فروسية", "ملاكمة", "مصارعة", "كاراتيه", "جودو", "تايكوندو", "جمباز", "رفع أثقال", "شطرنج", "قراءة", "كتابة", "رسم", "تلوين", "عزف", "غناء", "تصوير", "صيد", "طبخ", "خياطة", "تطريز", "نحت", "تخييم", "كرة يد", "كرة ماء", "تنس أرضي", "ريشة طاولة", "بلياردو", "سنوكر", "بولينج", "جولف", "هرم", "تزلج", "تزحلق", "ركوب أمواج", "شراع", "تجديف", "سباق سيارات", "سباق موتوسيكلات", "ماراثون", "وثب طويل", "وثب عالي", "رمي رمح", "رمي جلة", "رمي قرص", "رماية", "قوس وسهم", "سلاح شيش", "أيروبيكس", "يوجا", "زومبا", "كمال أجسام", "بيلاتس", "تصوير فوتوغرافي", "مونتاج فيديو", "تصميم جرافيك", "برمجة", "لعب جيمنج", "بلايستيشن", "جمع طوابع", "جمع عملات", "تربية عصافير", "تربية قطط", "تربية كلاب", "زراعة بلكونة", "أشغال يدوية", "كروشيه", "تريكو", "صناعة حظاظات", "تجميع بازل", "كلمات متقاطعة", "سودوكو", "قراءة روايات", "كتابة شعر", "تدوين", "تمثيل مسرحي", "مشاهدة أفلام", "سماع مزيكا", "رقص باليه", "رقص شعبي", "باركور", "غطس حر", "تسلق جبال", "قفز بالمظلات", "سكيت بورد"], "أجهزة وتكنولوجيا": ["موبايل", "لابتوب", "كمبيوتر", "ايباد", "تابلت", "سماعة", "مايك", "كاميرا", "شاشة", "بروجيكتور", "طابعة", "راوتر", "فلاشة", "هارد", "كيبورد", "ماوس", "بلايستيشن", "اكس بوكس", "ذراع تحكم", "شاحن", "باور بانك", "ساعة ذكية", "نظارة واقع افتراضي", "روبوت", "تكييف", "تلفزيون", "راديو", "كيسة كمبيوتر", "مازربورد", "بروسيسور", "رامات", "كارت شاشة", "كارت صوت", "مروحة بروسيسور", "باور سبلاي", "دي في دي", "سي دي", "اسطوانة", "شريط كاسيت", "فيديو", "ريسيفر", "طبق دش", "عدسة دش", "سلك نت", "كابل شاحن", "رأس شاحن", "شاحن وايرلس", "سماعة بلوتوث", "سماعة ايربودز", "صب ووفر", "مكبر صوت", "مايك استوديو", "كاميرا ديجيتال", "كاميرا فيديو", "ترايبود", "رينج لايت", "فلاش كاميرا", "ميموري كارد", "هارد اكسترنال", "شاشة سمارت", "شاشة كمبيوتر", "ماوس باد", "كيبورد جيمنج", "ماوس جيمنج", "نظارة ثري دي", "درون", "طيارة تصوير", "جهاز بصمة", "كاميرا مراقبة", "انتركم", "فاكس", "تليفون أرضي", "آلة حاسبة", "ماكينة كاشير", "ماكينة عد فلوس", "سويتش نت", "اكسس بوينت", "ريموت كنترول", "ريموت تكييف", "منبه ديجيتال", "جهاز إنذار", "حساس حركة", "رسيفر واي فاي", "نظارة ذكية", "قلم ليزر", "ميكروفون لاسلكي"] };

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection:', reason); });

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function getSimilarWords(correctWord, categoryName) {
    let categoryWords = categorizedWords[categoryName] || [];
    let filtered = categoryWords.filter(w => w !== correctWord); filtered = shuffleArray(filtered); let selected = filtered.slice(0, 14);
    if (selected.length < 14) { let otherWords = []; Object.keys(categorizedWords).forEach(cat => { if (cat !== categoryName) otherWords.push(...categorizedWords[cat]); }); otherWords = otherWords.filter(w => w !== correctWord && !selected.includes(w)); otherWords = shuffleArray(otherWords); selected = selected.concat(otherWords.slice(0, 14 - selected.length)); }
    selected.push(correctWord); return shuffleArray(selected); 
}

function cleanupRoom(roomId) {
    if (!rooms[roomId]) return;
    if (rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
    if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
    if (rooms[roomId].rebusTimer) clearTimeout(rooms[roomId].rebusTimer);
    if (rooms[roomId].players) { Object.values(rooms[roomId].players).forEach(p => { if (p.disconnectTimeout) clearTimeout(p.disconnectTimeout); }); }
    delete rooms[roomId];
}

function emitUpdatedPlayers(roomId) {
    if (!rooms[roomId]) return;
    let playersArray = Object.values(rooms[roomId].players).map(p => ({
        ...p,
        score: rooms[roomId].scores && rooms[roomId].scores[p.id] !== undefined ? rooms[roomId].scores[p.id] : 0
    }));
    playersArray.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id.localeCompare(b.id); 
    });
    io.to(roomId).emit('updatePlayers', playersArray);
}

function checkVotingResult(roomId) {
    if (!rooms[roomId]) return;
    const voteCounts = {}; Object.values(rooms[roomId].votes).forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; });
    let maxVotes = 0; for (const count of Object.values(voteCounts)) { if (count > maxVotes) maxVotes = count; }
    const tiedIds = []; for (const [id, count] of Object.entries(voteCounts)) { if (count === maxVotes) tiedIds.push(id); }
    const totalPlayers = Object.keys(rooms[roomId].players).length;
    
    if (tiedIds.length > 1 && totalPlayers > 1) {
        rooms[roomId].gameState = 'voting_tied'; const tiedNames = tiedIds.map(id => rooms[roomId].players[id] ? rooms[roomId].players[id].name : "لاعب غادر").join(' و ');
        io.to(roomId).emit('votingTied', { tiedNames: tiedNames }); rooms[roomId].votes = {}; 
        if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
        rooms[roomId].tieTimer = setTimeout(() => { if(rooms[roomId] && rooms[roomId].gameState === 'voting_tied') { rooms[roomId].gameState = 'voting'; io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players)); } }, 12000); 
        return;
    }
    
    rooms[roomId].gameState = 'voting_result'; const topVotedId = tiedIds[0]; const isSpyCaught = (topVotedId === rooms[roomId].spyId);
    const votedPlayer = rooms[roomId].players[topVotedId]; const votedPlayerName = votedPlayer ? votedPlayer.name : "لاعب غادر";
    const spyPlayer = rooms[roomId].players[rooms[roomId].spyId]; const spyName = spyPlayer ? spyPlayer.name : "الجاسوس";
    io.to(roomId).emit('votingEnded', { isSpyCaught: isSpyCaught, votedPlayerName: votedPlayerName, spyName: spyName, spyId: rooms[roomId].spyId });
}

function handlePlayerLeave(roomId, playerId) {
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) return;
    const isHost = rooms[roomId].players[playerId].isHost; const wasVoting = (rooms[roomId].gameState === 'voting'); let gameAborted = false;
    
    if (isHost) { 
        io.to(roomId).emit('hostLeftRoom'); 
        cleanupRoom(roomId); 
        return; 
    }
    
    if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(rooms[roomId].gameState)) { 
        if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); 
        if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer); 
        rooms[roomId].gameState = 'waiting'; 
        rooms[roomId].votes = {}; 
        io.to(roomId).emit('gameRestarted'); 
        gameAborted = true; 
    }
    
    delete rooms[roomId].players[playerId];
    
    if (rooms[roomId]) {
        emitUpdatedPlayers(roomId);
        if (Object.keys(rooms[roomId].players).length === 0) { cleanupRoom(roomId); return; }
        if (wasVoting && !gameAborted) {
            if (rooms[roomId].votes[playerId]) delete rooms[roomId].votes[playerId];
            const totalVotes = Object.keys(rooms[roomId].votes).length; 
            const remainingPlayersCount = Object.keys(rooms[roomId].players).length;
            io.to(roomId).emit('playerRemovedFromVoting', playerId); 
            io.to(roomId).emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: remainingPlayersCount });
            if (totalVotes >= remainingPlayersCount && remainingPlayersCount > 0) checkVotingResult(roomId);
        }
    }
}

function normalizeArabic(text) { return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').trim(); }
function getEditDistance(a, b) {
    if (a.length === 0) return b.length; if (b.length === 0) return a.length; 
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) { matrix[i][j] = matrix[i - 1][j - 1]; } 
            else { matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)); }
        }
    }
    return matrix[b.length][a.length];
}

io.on('connection', (socket) => {
    socket.on('createRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId; const hostName = data.name || '𝐒𝐀𝐒𝐔𝐊𝐄';
            socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
            
            if (!rooms[roomId]) { rooms[roomId] = { players: {}, gameState: 'waiting', gameMode: data.gameMode || 'spy', scores: {}, currentRound: 0, guessedPlayers: [] }; }
            rooms[roomId].gameMode = data.gameMode || 'spy';
            
            if (!rooms[roomId].scores) rooms[roomId].scores = {};
            rooms[roomId].scores[playerId] = 0; 
            
            if (rooms[roomId].players[playerId] && rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
            
            const existingName = rooms[roomId].players[playerId] ? rooms[roomId].players[playerId].name : hostName;
            rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: existingName, isHost: true };
            
            emitUpdatedPlayers(roomId);
            socket.emit('syncState', rooms[roomId].gameState, rooms[roomId].gameMode);
        } catch (e) {}
    });

    socket.on('joinRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId;
            if (rooms[roomId]) {
                const isExistingPlayer = !!rooms[roomId].players[playerId];
                
                socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
                
                if (isExistingPlayer) {
                    if (rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
                    rooms[roomId].players[playerId].socketId = socket.id;
                } else {
                    let finalName = data.name.trim(); let suffix = 1;
                    while(Object.values(rooms[roomId].players).some(p => p.name === finalName)) { finalName = `${data.name.trim()} (${suffix})`; suffix++; }
                    rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: finalName, isHost: false };
                    rooms[roomId].scores[playerId] = 0;
                }
                
                emitUpdatedPlayers(roomId);
                socket.emit('syncState', rooms[roomId].gameState, rooms[roomId].gameMode);
            } else {
                socket.emit('errorMsg', 'الغرفة دي مش موجودة أو الهوست قفل اللعبة!');
            }
        } catch (e) {}
    });

    socket.on('changePlayerName', (data) => { let roomId = socket.roomId || data.fallbackRoomId; if(roomId && rooms[roomId] && rooms[roomId].players[data.targetId]) { rooms[roomId].players[data.targetId].name = data.newName; emitUpdatedPlayers(roomId); io.to(rooms[roomId].players[data.targetId].socketId).emit('forceNameLock', data.newName); } });
    socket.on('kickPlayer', (data) => { let tid = data.targetId; let roomId = socket.roomId || data.fallbackRoomId; if(roomId && rooms[roomId] && rooms[roomId].players[tid]) { delete rooms[roomId].players[tid]; emitUpdatedPlayers(roomId); } });
    
    socket.on('destroyRoom', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId] && rooms[roomId].players[socket.playerId] && rooms[roomId].players[socket.playerId].isHost) {
            io.to(roomId).emit('hostLeftRoom');
            cleanupRoom(roomId);
        }
    });

    socket.on('leaveRoom', () => { const roomId = socket.roomId; if (roomId && rooms[roomId]) { delete rooms[roomId].players[socket.playerId]; emitUpdatedPlayers(roomId); } });

    socket.on('goToModeSelection', (fallbackRoomId) => { let r = socket.roomId || fallbackRoomId; if(r && rooms[r]) io.to(r).emit('showModeSelection'); });
    
    socket.on('selectCategory', (cat, fallbackRoomId) => { let r = socket.roomId || fallbackRoomId; if(r && rooms[r]) { io.to(r).emit('categorySelected', cat); } });

    socket.on('spinWheel', (targetCat, fallbackRoomId) => { let r = socket.roomId || fallbackRoomId; if(r && rooms[r]) { io.to(r).emit('wheelSpinning', targetCat); } });

    socket.on('startGameWithCategory', (cat, fallbackRoomId) => {
        let r = socket.roomId || fallbackRoomId;
        if(r && rooms[r]) {
            rooms[r].gameState = 'playing'; const wl = categorizedWords[cat] || categorizedWords["أكل وشرب"];
            const w = wl[Math.floor(Math.random() * wl.length)]; rooms[r].word = w; rooms[r].category = cat; 
            const pArr = Object.values(rooms[r].players); const g = pArr.filter(p => !p.isHost);
            let sId = g.length > 0 ? g[Math.floor(Math.random() * g.length)].id : pArr[0].id; rooms[r].spyId = sId;
            pArr.forEach(p => io.to(p.socketId).emit('gameStarted', { word: w, isSpy: p.id === sId, category: cat }));
        }
    });

    socket.on('startVotingPhase', (fallbackRoomId) => { let roomId = socket.roomId || fallbackRoomId; if(roomId && rooms[roomId]) { rooms[roomId].gameState = 'voting'; rooms[roomId].votes = {}; if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer); io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players)); } });

    socket.on('submitVote', (data) => {
        let targetId = typeof data === 'object' ? data.targetId : data; let fallbackRoomId = typeof data === 'object' ? data.fallbackRoomId : null;
        let roomId = socket.roomId || fallbackRoomId; const playerId = socket.playerId;
        if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
            rooms[roomId].votes[playerId] = targetId; const totalVotes = Object.keys(rooms[roomId].votes).length; const totalPlayers = Object.keys(rooms[roomId].players).length;
            io.to(roomId).emit('voteRegistered', { voterName: rooms[roomId].players[playerId].name, targetName: rooms[roomId].players[targetId] ? rooms[roomId].players[targetId].name : "لاعب غادر", currentVotes: totalVotes, totalRequired: totalPlayers });
            if(totalVotes >= totalPlayers) checkVotingResult(roomId);
        }
    });

    socket.on('startGuessingPhase', () => {
        const roomId = socket.roomId;
        if(roomId && rooms[roomId]) {
            rooms[roomId].gameState = 'guessing'; rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word, rooms[roomId].category); rooms[roomId].guessEndTime = Date.now() + 30000; 
            io.to(roomId).emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: 30 });
            if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
            rooms[roomId].guessTimer = setTimeout(() => { if(rooms[roomId] && rooms[roomId].gameState === 'guessing') { rooms[roomId].gameState = 'waiting'; io.to(roomId).emit('spyTimeOut'); } }, 30000); 
        }
    });

    socket.on('spyHoverWord', (word) => { const roomId = socket.roomId; const playerId = socket.playerId; if(roomId && rooms[roomId]) io.to(roomId).emit('spySelectedWord', { word: word, spyName: rooms[roomId].players[playerId].name }); });
    socket.on('spyConfirmWord', (chosenWord) => { 
        const roomId = socket.roomId; const playerId = socket.playerId; 
        if(roomId && rooms[roomId]) { 
            if (rooms[roomId].gameState !== 'guessing') return; 
            rooms[roomId].gameState = 'waiting'; if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); 
            io.to(roomId).emit('gameFinalResult', { spyName: rooms[roomId].players[playerId].name, chosenWord: chosenWord, correctWord: rooms[roomId].word, isCorrect: (chosenWord === rooms[roomId].word) }); 
        } 
    });

    // 🔥 التايمر المتزامن 80 ثانية
    socket.on('startRebusGame', (fallbackRoomId) => {
        let r = socket.roomId || fallbackRoomId;
        if(r && rooms[r]) {
            rooms[r].gameState = 'rebus_playing'; 
            rooms[r].gameMode = 'rebus'; 
            rooms[r].scores = {};
            Object.keys(rooms[r].players).forEach(pid => rooms[r].scores[pid] = 0);
            emitUpdatedPlayers(r);
            
            let shuffledPuzzles = shuffleArray([...rebusPuzzlesDB]);
            rooms[r].selectedPuzzles = shuffledPuzzles.slice(0, 10);
            
            rooms[r].currentRound = 0; 
            startNextRebusRound(r);
        }
    });

    socket.on('sendChatMsg', (data) => {
        let r = socket.roomId || data.fallbackRoomId;
        if(r && rooms[r] && rooms[r].gameState === 'rebus_playing') {
            let pid = socket.playerId; 
            let pName = rooms[r].players[pid].name;
            if(rooms[r].guessedPlayers.includes(pid)) return; 

            let guess = data.msg.trim();
            let answer = rooms[r].currentPuzzle.answer;

            if(guess === answer) {
                let guessedCount = rooms[r].guessedPlayers.length;
                let pts = 20 - guessedCount;
                if (pts < 11) pts = 11;
                
                rooms[r].scores[pid] += pts; 
                rooms[r].guessedPlayers.push(pid);
                
                io.to(r).emit('rebusCorrectGuess', { playerName: pName });
                emitUpdatedPlayers(r);
                
                if(rooms[r].guessedPlayers.length >= Object.keys(rooms[r].players).length) {
                    if(rooms[r].rebusTimer) clearTimeout(rooms[r].rebusTimer);
                    endRebusRound(r);
                }
            } else {
                let g = normalizeArabic(guess);
                let a = normalizeArabic(answer);
                if (g !== a && Math.abs(g.length - a.length) <= 2) {
                    let diff = getEditDistance(g, a);
                    if (diff <= 1 || (diff <= 2 && a.length >= 5)) {
                        io.to(socket.id).emit('rebusCloseGuess', { msg: data.msg });
                        return;
                    }
                }
                io.to(r).emit('rebusChatMsg', { playerName: pName, msg: data.msg });
            }
        }
    });

    function startNextRebusRound(roomId) {
        if(!rooms[roomId]) return;
        rooms[roomId].currentRound++;
        
        if(rooms[roomId].currentRound > 10) {
            rooms[roomId].gameState = 'waiting';
            let sorted = Object.keys(rooms[roomId].scores).map(pid => ({ name: rooms[roomId].players[pid] ? rooms[roomId].players[pid].name : 'غادر', score: rooms[roomId].scores[pid] })).sort((a,b) => b.score - a.score);
            io.to(roomId).emit('rebusGameOver', sorted); return;
        }
        
        rooms[roomId].guessedPlayers = [];
        let puz = rooms[roomId].selectedPuzzles[rooms[roomId].currentRound - 1];
        rooms[roomId].currentPuzzle = puz;
        
        rooms[roomId].rebusEndTime = Date.now() + 80000; // تايمر سيرفر دقيق 80 ثانية
        
        io.to(roomId).emit('rebusRoundStarted', { 
            round: rooms[roomId].currentRound, 
            clue: puz.clue, 
            category: puz.category,
            endTime: rooms[roomId].rebusEndTime
        });

        if(rooms[roomId].rebusTimer) clearTimeout(rooms[roomId].rebusTimer);
        rooms[roomId].rebusTimer = setTimeout(() => { endRebusRound(roomId); }, 80000);
    }

    function endRebusRound(roomId) {
        if(!rooms[roomId]) return;
        const winnersCount = rooms[roomId].guessedPlayers.length;
        io.to(roomId).emit('rebusRoundEnded', { answer: rooms[roomId].currentPuzzle.answer, winners: winnersCount });
        setTimeout(() => startNextRebusRound(roomId), 4000);
    }

    socket.on('restartGame', () => { 
        let r = socket.roomId; if (!r) { for (const rm in rooms) { if (rooms[rm].players[socket.playerId]) { r = rm; break; } } }
        if(r && rooms[r]) { 
            if(rooms[r].guessTimer) clearTimeout(rooms[r].guessTimer); if(rooms[r].tieTimer) clearTimeout(rooms[r].tieTimer); if(rooms[r].rebusTimer) clearTimeout(rooms[r].rebusTimer);
            rooms[r].gameState = 'waiting'; rooms[r].votes = {}; io.to(r).emit('gameRestarted'); 
        } 
    });

    socket.on('disconnect', () => { 
        const roomId = socket.roomId; const playerId = socket.playerId; 
        if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) { 
            const isHost = rooms[roomId].players[playerId].isHost;
            const timeoutLimit = isHost ? 3600000 : 180000; 
            rooms[roomId].players[playerId].disconnectTimeout = setTimeout(() => { handlePlayerLeave(roomId, playerId); }, timeoutLimit); 
        } 
    });
});

server.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Server running on port ${PORT}`); });