const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🔥 تحديث الـ Ping عشان السيرفر ميفصلش اللاعبين لو النت رمش
const io = socketIo(server, {
    pingTimeout: 120000, 
    pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.get('/health', (req, res) => res.status(200).send('OK'));

let rooms = {};

const categorizedWords = {
    "حاجات جوا وبرا البيت": ["سرير", "مخدة", "بطانية", "دولاب", "شماعة", "مراية", "سجادة", "ستارة", "نجفة", "لمبة", "فيشة", "مفتاح كهرباء", "باب", "شباك", "بلكونة", "ريموت", "تلفزيون", "كنبة", "كرسي", "طاولة", "مكتب", "ساعة حائط", "فازة", "وردة", "صورة", "مروحة", "تكييف", "دفاية", "غسالة", "ثلاجة", "بوتاجاز", "فرن", "ميكروويف", "خلاط", "كاتل", "حنفية", "حوض", "صابونة", "فوطة", "ليفة", "شامبو", "معجون أسنان", "فرشاة أسنان", "مشط", "مقص أظافر", "استشوار", "مكواة", "مكنسة", "ممسحة", "مقشة", "جاروف", "زبالة", "كيس", "علبة", "صندوق", "درج", "قفل", "شنطة", "محفظة", "نظارة", "شاحن", "سماعة", "لاب توب", "تابلت", "كيبورد", "ماوس", "سلك", "كرتونة", "مسمار", "شاكوش", "مفك", "بنسة", "غراء", "شريط لحام", "بطارية", "ولاعة", "شمعة", "كبريت", "مبخرة", "سبحة", "سجادة صلاة", "مصحف", "قلم", "ورقة", "دباسة", "استيكة", "براية", "مسطرة", "لون", "لوحة", "ملف", "تقويم", "نوتة", "منبه", "حصالة", "ميزان", "طفاية حريق", "عمود نور", "إشارة مرور", "رصيف", "يافطة", "صندوق زبالة", "كشك", "نافورة", "تمثال", "سور", "بوابة", "عتبة", "بلاط", "أسفلت", "طوبة", "زلطة", "يافطة محل", "كابينة تليفون", "مطب", "كوبري مشاة", "نفق", "جراج", "بدروم", "روف", "خزان مياه", "دش", "بانيو", "بيديه", "سخان", "شفاط", "انبوبة", "ولاعة غاز", "فنجان", "طبق", "معلقة", "شوكة", "سكينة", "كوباية", "دورق", "براد", "صينية", "مطبقية", "قطاعة", "مصفاة", "طشت", "جردل", "خرطوم", "بوابة عمارة", "يافطة دكتور", "يافطة صيدلية", "شجرة في الشارع", "عربية راكنة", "موتوسيكل راكن", "توكتوك", "ميكروباص", "كشك سجاير", "فرشة فاكهة", "عربية فول", "عربية كبدة", "فرن عيش", "محل بقالة", "سوبر ماركت", "حلاق", "مكوجي", "مغسلة"],
    "أكل وشرب": ["أرز", "مكرونة", "عيش", "بيض", "جبنة", "لبن", "زبادي", "عسل", "حلاوة", "مربى", "زيت", "سمنة", "زبدة", "ملح", "سكر", "فلفل", "كمون", "شطة", "كاتشب", "مايونيز", "بطاطس", "طماطم", "خيار", "بصل", "ثوم", "جزر", "فلفل رومي", "بتنجان", "كوسة", "بسلة", "فاصوليا", "عدس", "فول", "طعمية", "كشري", "حواوشي", "بيتزا", "برجر", "شاورما", "كباب", "كفتة", "فراخ", "لحمة", "سمك", "تونة", "كبدة", "شوربة", "سلطة", "مخلل", "شيبسي", "لبان", "بونبوني", "شوكولاتة", "بسكويت", "كيكة", "ايس كريم", "كنافة", "بسبوسة", "فاكهة", "تفاح", "موز", "برتقال", "عنب", "بطيخ", "مانجو", "فراولة", "خوخ", "رمان", "كمثرى", "جوافة", "تمر", "تين", "مشمش", "أناناس", "كيوي", "كانز", "مياه", "شاي", "قهوة", "عصير", "بيبسي", "كوكاكولا", "سفن اب", "ميرندا", "عصير قصب", "تمر هندي", "سوبيا", "لبن رايب", "ينسون", "نعناع", "قرفة", "كاكاو", "نسكافيه", "كابتشينو", "شاي بلبن", "سحلب", "خروب", "كريب", "فطير", "بان كيك", "وافل", "دوناتس", "جيلي", "مارشميلو", "غزل البنات", "لب", "سوداني", "فستق", "لوز", "بندق", "كاجو", "عين جمل", "بقسماط", "شابورة", "كرواسون", "باتيه", "سميط", "فايش", "ملوخية", "سبانخ", "قلقاس", "محشي", "ورق عنب", "كرنب", "ممبار", "بامية", "قرنبيط", "بروكلي", "مشروم", "ليمون", "اسبريسو", "موكا", "لاتيه", "شاي أخضر", "قهوة تركي", "قهوة عربي", "عصير مانجو", "عصير فراولة", "عصير تفاح", "سردين", "جمبري", "كابوريا", "استاكوزا", "سبيط", "سمك بلطي", "سمك بوري", "لحمة مفرومة", "سجق", "سوسيس", "بسطرمة", "لانشون", "رومي مدخن", "جبنة رومي", "جبنة بيضا", "جبنة نستو", "جبنة قديمة", "مية معدنية", "مية غازية", "شويبس", "فيروز", "عصير قمر الدين", "عصير برتقال", "عصير ليمون", "زبادو", "ميلك شيك", "فرابيتشينو", "سموزي"],
    "أدوات وأشياء": ["سكينة", "شوكة", "معلقة", "طبق", "كوباية", "فنجان", "براد", "حلة", "طاسة", "صينية", "مبشرة", "مقشرة", "مصفاة", "هراسة", "مغرفة", "هون", "لبانة", "كنكة", "طقم توابل", "برطمان", "ترمس", "طرشي", "زمزمية", "لانش بوكس", "شنطة سفر", "كوتشي", "صندل", "شبشب", "شراب", "قميص", "بنطلون", "تيشيرت", "بلوفر", "جاكيت", "بالطو", "بدلة", "فستان", "طرحة", "جيبة", "بيجامة", "جلاليبة", "عباية", "كاب", "برنيطة", "جوانتي", "كوفية", "حزام", "كرافتة", "ساعة يد", "خاتم", "غويشة", "سلسلة", "حلق", "توكة", "بنسة شعر", "بروش", "ميدالية", "شمسية", "علم", "خريطة", "بوصلة", "تلسكوب", "ميكروسكوب", "كاميرا", "ميكروفون", "بيانو", "جيتار", "طبلة", "كمانجة", "ناي", "قانون", "سماعة دي جي", "مروحة ايد", "ريشة", "كرة قدم", "كرة سلة", "مضرب تنس", "طاولة بينج بونج", "شطرنج", "دومينو", "كوتشينة", "سلم وتعبان", "لودو", "طيارة ورق", "مرجيحة", "زحليقة", "مسدس ميه", "بالونة", "صاروخ", "عروسة لعبة", "دبدوب", "عجلة", "سكوتر", "نظارة شمس", "نظارة نظر", "عدسات", "محلول", "قطرة", "بلاستر", "شاش", "قطن", "سرنجة", "ترمومتر", "خيط", "إبرة", "مقص", "مازورة", "متر", "فرشاة صبغ", "رولة", "جردل", "خرطوم", "سلم خشب", "منشار", "شنيور", "صاروخ كهربائي", "مسمار قلاووظ", "صامولة", "وردة مسمار", "أزميل", "مبرد", "مشرط", "مفك صليبة", "مفك عادة", "كماشة", "قطاعة سلك", "شريط قياس", "ميزان ميه", "كوريك", "مفتاح انجليزي", "مفتاح فرنساوي", "قلم رصاص", "قلم جاف", "قلم سبورة", "قلم فلوماستر", "كراسة", "كشكول", "كتاب", "مجلد", "دوسيه", "خراطة", "استيكة", "كوريكتور", "صمغ", "سلوتيب", "استيك", "دبوس مكتب", "دبوس طرحة"],
    "أماكن ومواصلات": ["جامع", "كنيسة", "مستشفى", "صيدلية", "مدرسة", "حضانة", "جامعة", "سنتر", "مكتبة", "محل", "سوبر ماركت", "مول", "مطعم", "كافيه", "ورشة", "بنك", "بنزينة", "قسم شرطة", "مطافي", "سجن", "محكمة", "سفارة", "قصر", "فيلا", "عمارة", "شقة", "فندق", "سينما", "مسرح", "كباريه", "سيرك", "ملاهي", "حديقة", "جنينة", "غابة", "صحراء", "شاطئ", "بحر", "نهر", "بحيرة", "جبل", "كهف", "شارع", "كوبري", "نفق", "محطة", "رصيف", "مطار", "ميناء", "مركب", "سفينة", "لنش", "يخت", "قارب", "غواصة", "طيارة", "هليكوبتر", "سيارة", "تاكسي", "ميكروباص", "اتوبيس", "مترو", "قطار", "ترام", "توكتوك", "موتوسيكل", "فيسبا", "عجلة", "سكوتر", "لودر", "ونش", "عربية اسعاف", "عربية مطافي", "بوكس شرطة", "دبابة", "مخبز", "مغسلة", "كوافير", "صالون حلاقة", "صالة جيم", "نادي", "استاد", "ملعب", "حمام سباحة", "متحف", "معرض", "عيادة", "معمل تحاليل", "شركة", "مصنع", "مخزن", "سوق", "جزارة", "مسمط", "مقلة", "عطارة", "مكتب بريد", "سنترال", "شهر عقاري", "مرور", "سجل مدني", "طيارة ورق", "بالون طائر", "تلفريك", "حصان", "عربية كارو", "عربية نقل", "تريلا", "عربية نص نقل", "توك توك", "موتوسيكل صيني", "بيتش باجي", "جيت سكي", "بدال", "عوامة", "موقف اتوبيسات", "محطة قطر", "محطة مترو", "صالة وصول", "برج مراقبة", "منارة", "جزر", "واحة", "وادي", "شلال", "بركان", "خيمة", "عشة", "كوخ", "قبة", "ميدان", "دوران", "تقاطع", "حارة", "زقاق"],
    "حيوانات ونباتات": ["أسد", "نمر", "فهد", "ذئب", "ثعلب", "كلب", "قطة", "فار", "أرنب", "قرد", "نسناس", "فيل", "زرافة", "حصان", "حمار", "جمل", "بقرة", "جاموسة", "خروف", "معزة", "خنزير", "غزال", "دب", "باندا", "كنغر", "كوالا", "تمساح", "ثعبان", "سحلية", "برص", "سلحفاة", "ضفدع", "سمكة", "قرش", "حوت", "دولفين", "أخطبوط", "قنديل بحر", "استاكوزا", "كابوريا", "نحلة", "نملة", "دبانة", "ناموسة", "صرصار", "عنكبوت", "عقرب", "فراشة", "غراب", "حمامة", "عصفور", "صقر", "نسر", "بومة", "ببغاء", "بطة", "وزة", "فرخة", "ديك", "ديك رومي", "نعامة", "بطريق", "شجرة", "نخلة", "صبار", "نجيلة", "غصن", "ورقة شجر", "ليمونة", "برتقالة", "بذرة", "قنفذ", "خفاش", "سنجاب", "حرباء", "دودة", "يرقة", "خنفساء", "جرادة", "جعل", "دبور", "فرس النهر", "وحيد القرن", "فقمة", "حصان البحر", "نجم البحر", "محار", "جمبري", "سبيط", "طاووس", "نورس", "بجعة", "لقلق", "نعناع", "ريحان", "بقدونس", "كزبرة", "شبت", "كرفس", "جرجير", "خس", "فجل", "صبارة", "وردة بلدي", "فل", "ياسمين", "نرجس", "عباد الشمس", "قرنفل", "توليب", "بصلة", "فص ثوم", "جدر", "ساق", "لحاء", "ثمرة", "زهرة", "شجيرة", "سوسة", "برغوت", "قملة", "قراد", "بق", "خنزير غينيا", "دب قطبي", "بطريق", "فقمة", "كلب بحر", "سيد قشطة", "حمار وحشي", "غوريلا", "شمبانزي", "طحالب", "عشب", "نبات ظل"],
    "مهن ووظائف": ["دكتور", "مهندس", "مدرس", "ضابط", "محامي", "قاضي", "طيار", "ممرضة", "صيدلي", "نجار", "سباك", "كهربائي", "حداد", "جزار", "خباز", "حلاق", "كوافير", "محاسب", "مدير", "سكرتير", "صحفي", "مذيع", "ممثل", "مغني", "رسام", "كاتب", "عالم", "فلاح", "سواق", "بواب", "حارس", "طباخ", "جرسون", "عامل", "ميكانيكي", "صياد", "مفتش", "طبيب أسنان", "دكتور بيطري", "طبيب عيون", "جراح", "مسعف", "مهندس معماري", "مهندس ديكور", "مهندس كمبيوتر", "مبرمج", "مصمم", "مصور", "مونتير", "مخرج", "مؤلف", "شاعر", "ملحن", "موزع", "عازف", "راقص", "لاعب كورة", "مدرب", "حكم", "رئيس", "وزير", "محافظ", "عمدة", "ظابط شرطة", "ضابط جيش", "عسكري", "عريف", "شاويش", "محقق", "مخبر", "سباك صحي", "نقاش", "مبيض محارة", "بنا", "صنايعي", "مقاول", "سواق تاكسي", "سواق ميكروباص", "سواق قطر", "سواق طيارة", "كابتن بحري", "بحار", "غطاس", "مضيفة طيران", "مندوب مبيعات", "كاشير", "بياع", "صاحب محل", "تاجر", "مستورد", "جواهرجي", "سايس", "قهوجي", "جزمجي", "خياط", "ترزي", "منجد", "فني تكييف", "فني ألوميتال", "عامل نظافة", "زبال", "ساعي بريد", "طيار دليفري", "أمين مخزن", "بودي جارد", "كابتن جيم", "دكتور نفسي", "أخصائي تغذية", "فني أشعة", "كيميائي", "فيزيائي"],
    "رياضة وهوايات": ["كرة قدم", "كرة سلة", "كرة طائرة", "تنس", "تنس طاولة", "اسكواش", "سباحة", "غوص", "جري", "مشي", "عجل", "فروسية", "ملاكمة", "مصارعة", "كاراتيه", "جودو", "تايكوندو", "جمباز", "رفع أثقال", "شطرنج", "قراءة", "كتابة", "رسم", "تلوين", "عزف", "غناء", "تصوير", "صيد", "طبخ", "خياطة", "تطريز", "نحت", "تخييم", "كرة يد", "كرة ماء", "تنس أرضي", "ريشة طاولة", "بلياردو", "سنوكر", "بولينج", "جولف", "هرم", "تزلج", "تزحلق", "ركوب أمواج", "شراع", "تجديف", "سباق سيارات", "سباق موتوسيكلات", "ماراثون", "وثب طويل", "وثب عالي", "رمي رمح", "رمي جلة", "رمي قرص", "رماية", "قوس وسهم", "سلاح شيش", "أيروبيكس", "يوجا", "زومبا", "كمال أجسام", "بيلاتس", "تصوير فوتوغرافي", "مونتاج فيديو", "تصميم جرافيك", "برمجة", "لعب جيمنج", "بلايستيشن", "جمع طوابع", "جمع عملات", "تربية عصافير", "تربية قطط", "تربية كلاب", "زراعة بلكونة", "أشغال يدوية", "كروشيه", "تريكو", "صناعة حظاظات", "تجميع بازل", "كلمات متقاطعة", "سودوكو", "قراءة روايات", "كتابة شعر", "تدوين", "تمثيل مسرحي", "مشاهدة أفلام", "سماع مزيكا", "رقص باليه", "رقص شعبي", "باركور", "غطس حر", "تسلق جبال", "قفز بالمظلات", "سكيت بورد"],
    "أجهزة وتكنولوجيا": ["موبايل", "لابتوب", "كمبيوتر", "ايباد", "تابلت", "سماعة", "مايك", "كاميرا", "شاشة", "بروجيكتور", "طابعة", "راوتر", "فلاشة", "هارد", "كيبورد", "ماوس", "بلايستيشن", "اكس بوكس", "ذراع تحكم", "شاحن", "باور بانك", "ساعة ذكية", "نظارة واقع افتراضي", "روبوت", "تكييف", "تلفزيون", "راديو", "كيسة كمبيوتر", "مازربورد", "بروسيسور", "رامات", "كارت شاشة", "كارت صوت", "مروحة بروسيسور", "باور سبلاي", "دي في دي", "سي دي", "اسطوانة", "شريط كاسيت", "فيديو", "ريسيفر", "طبق دش", "عدسة دش", "سلك نت", "كابل شاحن", "رأس شاحن", "شاحن وايرلس", "سماعة بلوتوث", "سماعة ايربودز", "صب ووفر", "مكبر صوت", "مايك استوديو", "كاميرا ديجيتال", "كاميرا فيديو", "ترايبود", "رينج لايت", "فلاش كاميرا", "ميموري كارد", "هارد اكسترنال", "شاشة سمارت", "شاشة كمبيوتر", "ماوس باد", "كيبورد جيمنج", "ماوس جيمنج", "نظارة ثري دي", "درون", "طيارة تصوير", "جهاز بصمة", "كاميرا مراقبة", "انتركم", "فاكس", "تليفون أرضي", "آلة حاسبة", "ماكينة كاشير", "ماكينة عد فلوس", "سويتش نت", "اكسس بوينت", "ريموت كنترول", "ريموت تكييف", "منبه ديجيتال", "جهاز إنذار", "حساس حركة", "رسيفر واي فاي", "نظارة ذكية", "قلم ليزر", "ميكروفون لاسلكي"]
};

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
    let filtered = categoryWords.filter(w => w !== correctWord);
    filtered = shuffleArray(filtered);
    let selected = filtered.slice(0, 14);

    if (selected.length < 14) {
        let otherWords = [];
        Object.keys(categorizedWords).forEach(cat => { if (cat !== categoryName) otherWords.push(...categorizedWords[cat]); });
        otherWords = otherWords.filter(w => w !== correctWord && !selected.includes(w));
        otherWords = shuffleArray(otherWords);
        selected = selected.concat(otherWords.slice(0, 14 - selected.length));
    }
    selected.push(correctWord); return shuffleArray(selected); 
}

function cleanupRoom(roomId) {
    if (!rooms[roomId]) return;
    if (rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
    if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
    if (rooms[roomId].players) { Object.values(rooms[roomId].players).forEach(p => { if (p.disconnectTimeout) clearTimeout(p.disconnectTimeout); }); }
    delete rooms[roomId];
}

function checkVotingResult(roomId) {
    if (!rooms[roomId]) return;
    const voteCounts = {};
    Object.values(rooms[roomId].votes).forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; });
    let maxVotes = 0;
    for (const count of Object.values(voteCounts)) { if (count > maxVotes) maxVotes = count; }
    const tiedIds = [];
    for (const [id, count] of Object.entries(voteCounts)) { if (count === maxVotes) tiedIds.push(id); }
    const totalPlayers = Object.keys(rooms[roomId].players).length;
    
    if (tiedIds.length > 1 && totalPlayers > 1) {
        rooms[roomId].gameState = 'voting_tied';
        const tiedNames = tiedIds.map(id => rooms[roomId].players[id] ? rooms[roomId].players[id].name : "لاعب غادر").join(' و ');
        io.to(roomId).emit('votingTied', { tiedNames: tiedNames });
        rooms[roomId].votes = {}; 
        if (rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
        rooms[roomId].tieTimer = setTimeout(() => {
            if(rooms[roomId] && rooms[roomId].gameState === 'voting_tied') {
                rooms[roomId].gameState = 'voting'; io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players));
            }
        }, 12000); 
        return;
    }

    rooms[roomId].gameState = 'voting_result';
    const topVotedId = tiedIds[0];
    const isSpyCaught = (topVotedId === rooms[roomId].spyId);
    const votedPlayer = rooms[roomId].players[topVotedId]; const votedPlayerName = votedPlayer ? votedPlayer.name : "لاعب غادر";
    const spyPlayer = rooms[roomId].players[rooms[roomId].spyId]; const spyName = spyPlayer ? spyPlayer.name : "الجاسوس";
    io.to(roomId).emit('votingEnded', { isSpyCaught: isSpyCaught, votedPlayerName: votedPlayerName, spyName: spyName, spyId: rooms[roomId].spyId });
}

function handlePlayerLeave(roomId, playerId) {
    if (!rooms[roomId] || !rooms[roomId].players[playerId]) return;
    const isHost = rooms[roomId].players[playerId].isHost;
    const wasVoting = (rooms[roomId].gameState === 'voting');
    let gameAborted = false;

    if (isHost) {
        const hostName = rooms[roomId].players[playerId].name; io.to(roomId).emit('hostLeftRoom', hostName); cleanupRoom(roomId); return; 
    }

    if (rooms[roomId].spyId === playerId && ['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(rooms[roomId].gameState)) {
        if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
        rooms[roomId].gameState = 'waiting'; rooms[roomId].votes = {}; io.to(roomId).emit('gameRestarted'); gameAborted = true;
    }

    delete rooms[roomId].players[playerId];

    if (rooms[roomId]) {
        io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
        if (Object.keys(rooms[roomId].players).length === 0) { cleanupRoom(roomId); return; }
        if (wasVoting && !gameAborted) {
            if (rooms[roomId].votes[playerId]) delete rooms[roomId].votes[playerId];
            const totalVotes = Object.keys(rooms[roomId].votes).length; const remainingPlayersCount = Object.keys(rooms[roomId].players).length;
            io.to(roomId).emit('playerRemovedFromVoting', playerId); 
            io.to(roomId).emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: totalVotes, totalRequired: remainingPlayersCount });
            if (totalVotes >= remainingPlayersCount && remainingPlayersCount > 0) checkVotingResult(roomId);
        }
    }
}

io.on('connection', (socket) => {
    socket.on('createRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId; 
            const hostName = data.name || '𝐒𝐀𝐒𝐔𝐊𝐄';
            socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
            
            if (!rooms[roomId]) { rooms[roomId] = { players: {}, gameState: 'waiting', word: '', category: '', spyId: null, votes: {}, guessingWords: [], guessTimer: null, tieTimer: null, guessEndTime: 0, featureVotes: { hints: [], questions: [] } }; }
            
            if (rooms[roomId].players[playerId] && rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
            
            const existingName = rooms[roomId].players[playerId] ? rooms[roomId].players[playerId].name : hostName;
            rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: existingName, isHost: true };
            io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
            
            const state = rooms[roomId].gameState; socket.emit('syncState', state);

            if(['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(state)) {
                socket.emit('gameStarted', { word: rooms[roomId].word, isSpy: rooms[roomId].spyId === playerId, category: rooms[roomId].category });
                if (state === 'voting' || state === 'voting_result' || state === 'voting_tied') {
                    socket.emit('votingStarted', Object.values(rooms[roomId].players));
                    socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: Object.keys(rooms[roomId].votes).length, totalRequired: Object.keys(rooms[roomId].players).length });
                    if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
                } else if (state === 'guessing') {
                    let timeLeft = rooms[roomId].guessEndTime ? Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000)) : 30;
                    socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
                }
            }
        } catch (e) {}
    });

    socket.on('joinRoom', (data) => {
        try {
            const roomId = data.roomId; const playerId = data.playerId;
            if (rooms[roomId]) {
                const isExistingPlayer = !!rooms[roomId].players[playerId];
                if (!isExistingPlayer && rooms[roomId].gameState !== 'waiting') { socket.emit('errorMsg', 'لقد بدأت اللعبة بالفعل! 🚫 لا يمكنك الانضمام الآن.'); return; }

                socket.join(roomId); socket.roomId = roomId; socket.playerId = playerId;
                
                if (isExistingPlayer) {
                    if (rooms[roomId].players[playerId].disconnectTimeout) { clearTimeout(rooms[roomId].players[playerId].disconnectTimeout); rooms[roomId].players[playerId].disconnectTimeout = null; }
                    rooms[roomId].players[playerId].socketId = socket.id;
                } else {
                    let finalName = data.name.trim(); let suffix = 1;
                    while(Object.values(rooms[roomId].players).some(p => p.name === finalName)) { finalName = `${data.name.trim()} (${suffix})`; suffix++; }
                    rooms[roomId].players[playerId] = { id: playerId, socketId: socket.id, name: finalName, isHost: false };
                }
                io.to(roomId).emit('updatePlayers', Object.values(rooms[roomId].players));
                
                const state = rooms[roomId].gameState; socket.emit('syncState', state);

                if(['playing', 'voting', 'guessing', 'voting_result', 'voting_tied'].includes(state)) {
                    socket.emit('gameStarted', { word: rooms[roomId].word, isSpy: rooms[roomId].spyId === playerId, category: rooms[roomId].category });
                    if (state === 'voting' || state === 'voting_result' || state === 'voting_tied') {
                        socket.emit('votingStarted', Object.values(rooms[roomId].players));
                        socket.emit('voteRegistered', { voterName: "النظام", targetName: "", currentVotes: Object.keys(rooms[roomId].votes).length, totalRequired: Object.keys(rooms[roomId].players).length });
                        if (rooms[roomId].votes[playerId]) socket.emit('youAlreadyVoted', rooms[roomId].votes[playerId]);
                    } else if (state === 'guessing') {
                        let timeLeft = rooms[roomId].guessEndTime ? Math.max(1, Math.ceil((rooms[roomId].guessEndTime - Date.now()) / 1000)) : 30;
                        socket.emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: timeLeft });
                    }
                }
            } else socket.emit('errorMsg', 'الغرفة دي مش موجودة أو الهوست قفل اللعبة!');
        } catch (e) {}
    });

    socket.on('changePlayerName', (data) => { 
        try { 
            if(socket.roomId && rooms[socket.roomId] && rooms[socket.roomId].players[data.targetId]) { 
                rooms[socket.roomId].players[data.targetId].name = data.newName; 
                io.to(socket.roomId).emit('updatePlayers', Object.values(rooms[socket.roomId].players)); 
                io.to(rooms[socket.roomId].players[data.targetId].socketId).emit('forceNameLock', data.newName);
            } 
        } catch(e){} 
    });

    socket.on('kickPlayer', (targetId) => { try { const roomId = socket.roomId; if(roomId && rooms[roomId] && rooms[roomId].players[targetId]) { io.to(rooms[roomId].players[targetId].socketId).emit('youAreKickedPermanently'); handlePlayerLeave(roomId, targetId); } } catch(e){} });
    socket.on('leaveRoom', () => { try { const roomId = socket.roomId; const playerId = socket.playerId; if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) { handlePlayerLeave(roomId, playerId); socket.leave(roomId); } } catch(e){} });
    socket.on('goToModeSelection', () => { try { if(socket.roomId && rooms[socket.roomId]) { rooms[socket.roomId].featureVotes = { hints: [], questions: [] }; io.to(socket.roomId).emit('showModeSelection'); } } catch(e){} });

    socket.on('voteFeature', (feature) => {
        try {
            const roomId = socket.roomId; const playerId = socket.playerId;
            if(roomId && rooms[roomId]) {
                rooms[roomId].featureVotes = rooms[roomId].featureVotes || { hints: [], questions: [] };
                let hints = rooms[roomId].featureVotes.hints; let questions = rooms[roomId].featureVotes.questions;
                if (feature === 'hint') { if (hints.includes(playerId)) hints = hints.filter(id => id !== playerId); else { hints.push(playerId); questions = questions.filter(id => id !== playerId); } } 
                else if (feature === 'question') { if (questions.includes(playerId)) questions = questions.filter(id => id !== playerId); else { questions.push(playerId); hints = hints.filter(id => id !== playerId); } }
                rooms[roomId].featureVotes.hints = hints; rooms[roomId].featureVotes.questions = questions;
                io.to(roomId).emit('updateFeatureVotes', { hints: hints.length, questions: questions.length });
            }
        } catch(e){}
    });

    socket.on('selectCategory', (cat) => { io.to(socket.roomId).emit('categorySelected', cat); });
    socket.on('spinWheel', (targetCat) => { io.to(socket.roomId).emit('wheelSpinning', targetCat); });

    socket.on('startGameWithCategory', (categoryName) => {
        try {
            const roomId = socket.roomId;
            if(roomId && rooms[roomId]) {
                rooms[roomId].gameState = 'playing'; rooms[roomId].votes = {}; 
                if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
                if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
                
                const wordsList = categorizedWords[categoryName] || categorizedWords["أكل وشرب"];
                const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

                rooms[roomId].word = randomWord; rooms[roomId].category = categoryName; 

                const playersArray = Object.values(rooms[roomId].players);
                const guests = playersArray.filter(p => !p.isHost);
                let spyId = guests.length > 0 ? guests[Math.floor(Math.random() * guests.length)].id : playersArray[0].id;
                rooms[roomId].spyId = spyId;

                playersArray.forEach(player => {
                    io.to(player.socketId).emit('gameStarted', { word: randomWord, isSpy: player.id === spyId, category: categoryName });
                });
            }
        } catch(e){}
    });

    socket.on('startVotingPhase', (fallbackRoomId) => { 
        try { 
            let roomId = socket.roomId || fallbackRoomId;
            if (!roomId) { for (const r in rooms) { if (rooms[r].players[socket.playerId]) { roomId = r; socket.roomId = r; break; } } }
            if(roomId && rooms[roomId]) { 
                rooms[roomId].gameState = 'voting'; 
                rooms[roomId].votes = {}; 
                if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer);
                io.to(roomId).emit('votingStarted', Object.values(rooms[roomId].players)); 
            } 
        } catch(e){} 
    });

    socket.on('submitVote', (targetId) => {
        try {
            let roomId = socket.roomId;
            if (!roomId) { for (const r in rooms) { if (rooms[r].players[socket.playerId]) { roomId = r; break; } } }
            const playerId = socket.playerId;
            if(roomId && rooms[roomId] && rooms[roomId].gameState === 'voting') {
                rooms[roomId].votes[playerId] = targetId; const totalVotes = Object.keys(rooms[roomId].votes).length; const totalPlayers = Object.keys(rooms[roomId].players).length;
                io.to(roomId).emit('voteRegistered', { voterName: rooms[roomId].players[playerId].name, targetName: rooms[roomId].players[targetId] ? rooms[roomId].players[targetId].name : "لاعب غادر", currentVotes: totalVotes, totalRequired: totalPlayers });
                if(totalVotes >= totalPlayers) checkVotingResult(roomId);
            }
        } catch(e){}
    });

    socket.on('startGuessingPhase', () => {
        try {
            const roomId = socket.roomId;
            if(roomId && rooms[roomId]) {
                rooms[roomId].gameState = 'guessing'; rooms[roomId].guessingWords = getSimilarWords(rooms[roomId].word, rooms[roomId].category); rooms[roomId].guessEndTime = Date.now() + 30000; 
                io.to(roomId).emit('guessingPhaseStarted', { words: rooms[roomId].guessingWords, duration: 30 });
                if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer);
                rooms[roomId].guessTimer = setTimeout(() => { if(rooms[roomId] && rooms[roomId].gameState === 'guessing') { io.to(roomId).emit('spyTimeOut'); rooms[roomId].gameState = 'waiting'; } }, 30000); 
            }
        } catch(e){}
    });

    socket.on('spyHoverWord', (word) => { try { const roomId = socket.roomId; const playerId = socket.playerId; if(roomId && rooms[roomId]) io.to(roomId).emit('spySelectedWord', { word: word, spyName: rooms[roomId].players[playerId].name }); } catch(e){} });
    socket.on('spyConfirmWord', (chosenWord) => { try { const roomId = socket.roomId; const playerId = socket.playerId; if(roomId && rooms[roomId]) { if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); io.to(roomId).emit('gameFinalResult', { spyName: rooms[roomId].players[playerId].name, chosenWord: chosenWord, correctWord: rooms[roomId].word, isCorrect: (chosenWord === rooms[roomId].word) }); } } catch(e){} });
    
    socket.on('restartGame', () => { 
        try { 
            let roomId = socket.roomId;
            if (!roomId) { for (const r in rooms) { if (rooms[r].players[socket.playerId]) { roomId = r; break; } } }
            if(roomId && rooms[roomId]) { 
                if(rooms[roomId].guessTimer) clearTimeout(rooms[roomId].guessTimer); if(rooms[roomId].tieTimer) clearTimeout(rooms[roomId].tieTimer); 
                rooms[roomId].gameState = 'waiting'; rooms[roomId].votes = {}; 
                io.to(roomId).emit('gameRestarted'); 
            } 
        } catch(e){} 
    });

    socket.on('disconnect', () => { 
        try { 
            const roomId = socket.roomId; const playerId = socket.playerId; 
            if (roomId && rooms[roomId] && rooms[roomId].players[playerId]) { 
                // 🔥 تم زيادة وقت السماح لـ 3 دقايق (180000 ملي ثانية) عشان لو النت فصل ورجع ميتطردش
                rooms[roomId].players[playerId].disconnectTimeout = setTimeout(() => { handlePlayerLeave(roomId, playerId); }, 180000); 
            } 
        } catch(e){} 
    });
});

server.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });