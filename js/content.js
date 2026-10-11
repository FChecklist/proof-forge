/* Step 1 content: "Your ₹1 cycle". Six units of about 10 minutes. Each unit = prelude, questions (tap only), a real story, a mirror.
   Truth items have no right answer: they are scored on whether the answers agree with each other. Knowledge items have a right answer and teach. */
(function () {
  const PF = (window.PF = window.PF || {});
  const PRICE = [10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000, 100000, 250000, 500000];
  const DAYS = [0, 1, 2, 3, 5, 7, 10, 15, 20, 30, 45, 60, 90, 120];
  const UNITS_PM = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000];
  const CAC = [0, 10, 25, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000];
  const FIXED = [0, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
  const ALTS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20];
  const CUT = [2, 3, 5, 8, 10, 15, 20, 25, 30];
  const FREQ_OPTS = [{ v: "once", label: "Once, ever" }, { v: "year", label: "About once a year" }, { v: "few", label: "Every few months" }, { v: "month", label: "Every month" }, { v: "week", label: "Every week" }, { v: "day", label: "Almost every day" }];
  const pct = (arr) => arr.map((n) => ({ v: n, label: n + " out of 100" }));
  const isAgg = (S) => (PF.SHAPES[S.shape] || {}).cut;

  const items = {
    // ---------- UNIT 1: your idea, undressed ----------
    nooneelse: { fmt: "reflex", seconds: 8, text: () => "Gut answer, 8 seconds: no one else is doing exactly what I want to do.", opts: [{ v: true, label: "TRUE" }, { v: false, label: "FALSE" }], why: "Fast answers show what you really believe. We ask again, slowly, later, and show you the difference." },
    looked: { fmt: "multi", excl: "nowhere", text: () => "Where have you already searched for people doing this? Tick every place.", opts: [{ v: "google", label: "Google search" }, { v: "stores", label: "App Store or Play Store" }, { v: "market", label: "Amazon, Flipkart or other marketplaces" }, { v: "social", label: "Instagram, YouTube or LinkedIn" }, { v: "dir", label: "Justdial, IndiaMART or directories" }, { v: "shops", label: "Walked into real shops or markets" }, { v: "customers", label: "Asked a competitor's customers" }, { v: "nowhere", label: "Nowhere yet" }], why: "Investors search for ten minutes before they meet you. Better that you do it first." },
    alts: { fmt: "band", vals: ALTS, def: 3, unit: "alternatives", text: () => "How many alternatives or competitors did you find?", hint: "If you found none, choose 0. We will check that against your other answers.", why: "A real gap usually has competitors. Zero often means nobody pays for it." },
    edge: { fmt: "single", conf: true, text: () => "Why would a customer pick you over what they use today?", opts: [{ v: "cheaper", label: "I am cheaper" }, { v: "faster", label: "I am faster" }, { v: "trust", label: "They can trust me more" }, { v: "choice", label: "I offer more choice" }, { v: "easier", label: "I am easier to use" }, { v: "niche", label: "I serve a group others ignore" }, { v: "tech", label: "I use new technology" }, { v: "nothing", label: "Nothing yet, honestly" }], why: "Cheap and 'new technology' are the easiest edges to copy. A niche or trust is harder." },
    copy: { fmt: "tf", conf: true, text: () => "A small competitor team could copy my main feature within 30 days.", why: "If copying is easy, your edge is a head start, not a moat." },
    nooneelse2: { fmt: "pair", conf: true, text: () => "Think slowly now. Which sentence is closer to the truth?", opts: [{ v: "several", label: "Several others already do something similar" }, { v: "none", label: "Nobody does anything like this" }], why: "Same fact as the first question, asked another way. If your gut and your reasoning disagree, that is where the truth is hiding." },

    // ---------- UNIT 2: walk one order ----------
    chain: { fmt: "matrix", text: () => "Follow one order from the first hello to the money in your bank. For each link, who does it, and do you know how long and how much?", rows: [["find", "Find the customer"], ["order", "Take the order"], ["make", "Buy or make what you sell"], ["quality", "Check quality"], ["deliver", "Deliver or serve"], ["collect", "Collect the money"], ["support", "Handle complaints and returns"]], who: [["me", "Me"], ["hire", "Someone I will hire"], ["partner", "A partner"], ["nobody", "Nobody yet"]], know: [["yes", "Yes"], ["rough", "Roughly"], ["no", "No"]], why: "A business is a chain. Investors check every link, and the weakest link sets the speed of the whole business." },
    knowDeliver: { fmt: "tf", conf: true, text: () => "I know exactly who will deliver my product or service to the customer.", why: "Compare with the chain you just built." },
    payFirst: { fmt: "pair", text: () => "In your business, who pays first?", opts: [{ v: "me", label: "I pay my supplier first, then my customer pays me" }, { v: "customer", label: "My customer pays me first, then I pay my supplier" }], why: "Whoever pays first needs cash to bridge the gap. This is the heart of the money cycle." },
    firstCust: { fmt: "single", text: () => "How will your first 10 customers hear about you?", opts: [{ v: "friends", label: "Friends and family" }, { v: "social", label: "My own social media posts" }, { v: "ads", label: "Paid ads" }, { v: "cold", label: "Cold calls or visits" }, { v: "partner", label: "Through a partner or a shop" }, { v: "listing", label: "A marketplace listing" }, { v: "findme", label: "They will find me online" }], why: "Selling is work somebody must do. 'They will find me' means nobody has planned who does that work." },
    fieldOps: { fmt: "single", ord: true, text: () => "Who in your plan has done this work in real life, in the field?", opts: [{ v: "done", label: "I have done it myself for a month or more" }, { v: "partner", label: "A partner or hire has done it for a month or more" }, { v: "watched", label: "I have watched someone do it" }, { v: "talked", label: "I have only talked to people who do it" }, { v: "read", label: "I have only read or watched videos" }, { v: "none", label: "Nobody has" }], why: "Field reality has a thousand small surprises. Investors back founders who have already met them." },

    // ---------- UNIT 3: the clock ----------
    price: { fmt: "band", vals: PRICE, def: 8, money: true, text: (c) => "What will you charge for one " + c.noun + "?", hint: "Slide to the closest amount.", why: "Every other number in your business hangs from this one." },
    cut: { fmt: "band", vals: CUT, def: 4, unit: "%", only: isAgg, text: () => "What cut will you keep from each order?", hint: "The rest goes to the supplier or provider.", why: "An aggregator earns only its cut, not the whole order." },
    "reveal:agg": { fmt: "reveal", only: isAgg, kind: "agg" },
    cost: { fmt: "band", vals: PRICE, def: 5, money: true, only: (S) => !isAgg(S), text: (c) => "What will it cost you to make or buy one " + c.noun + "?", hint: "Count materials, delivery and anything you pay to produce one.", why: "The gap between price and cost is the only money you keep." },
    supTerms: { fmt: "single", ord: true, text: () => "When do you pay your supplier or provider?", opts: [{ v: -7, label: "In advance, about a week before" }, { v: 0, label: "On delivery" }, { v: 15, label: "15 days after delivery" }, { v: 30, label: "30 days after delivery" }, { v: 60, label: "60 days after delivery" }], why: "Credit from suppliers is free money. Advance payment is the opposite." },
    stockDays: { fmt: "band", vals: DAYS, def: 3, unit: "days", text: (c) => c.stockQ, why: "Money that sits in stock or preparation is money you cannot use." },
    delivDays: { fmt: "band", vals: DAYS, def: 3, unit: "days", text: (c) => c.delivQ, why: "The clock runs until the customer has what they paid for." },
    recvDays: { fmt: "single", ord: true, text: () => "When does the customer pay you?", opts: [{ v: 0, label: "On the spot, UPI or cash" }, { v: 7, label: "Within 7 days" }, { v: 15, label: "After 15 days" }, { v: 30, label: "After 30 days" }, { v: 45, label: "After 45 days" }, { v: 60, label: "After 60 days or more" }], why: "Every day a customer takes to pay is a day you finance them." },
    prepaid: { fmt: "tf", conf: true, text: () => "Most of my customers will pay me before I deliver.", why: "A second look at when the customer pays." },
    k1: { fmt: "tf", knowledge: true, correct: true, text: () => "If you hold less stock and customers pay faster, the same sales need less of your money.", expl: "True. Money is stuck for the days between paying and being paid. Shorter time, less money stuck." },
    k2: { fmt: "single", knowledge: true, correct: "shorter", ord: true, text: () => "Your supplier gives 30 days credit and your customer pays on the spot. Your money cycle gets...", opts: [{ v: "shorter", label: "Shorter, even negative" }, { v: "same", label: "About the same" }, { v: "longer", label: "Longer" }], expl: "Shorter. You collect before you pay, so the customer's money funds your business." },
    "reveal:cycle": { fmt: "reveal", kind: "cycle" },

    // ---------- UNIT 4: money in, and the leaks ----------
    volume: { fmt: "band", vals: UNITS_PM, def: 4, text: (c) => "How many " + c.noun + "s do you plan to sell in a month?", why: "Your plan's size drives how much money you need." },
    sellThrough: { fmt: "single", ord: true, text: (c) => "Out of every 100 " + c.noun + "s you make or stock, how many will really sell in time?", opts: pct([95, 80, 60, 40, 20]), why: "What does not sell is money you already spent." },
    returns: { fmt: "single", ord: true, text: () => "Of every 100 sold, how many come back as returns, refunds or cancellations?", opts: pct([0, 2, 5, 10, 20, 30]), why: "Returns are sales that never happened, and you still paid the costs." },
    badDebt: { fmt: "single", ord: true, text: () => "Of every 100 customers, how many will pay late or not pay at all?", opts: pct([0, 2, 5, 10, 20]), why: "Some money never comes back. The honest founder plans for it." },
    leaks: { fmt: "multi", excl: "none", text: () => "Which of these will take a slice of what you earn? Tick every one.", opts: [{ v: "platform", label: "Platform or marketplace fees" }, { v: "gateway", label: "Payment gateway fees" }, { v: "pack", label: "Packaging" }, { v: "delivery", label: "Delivery or logistics" }, { v: "ads", label: "Ads and marketing" }, { v: "damage", label: "Damage, theft or wastage" }, { v: "tools", label: "Software and tools" }, { v: "licence", label: "Licences and compliance" }, { v: "none", label: "None of these" }], why: "Most plans forget half of these. Each slice looks small and together they decide profit." },
    leakPct: { fmt: "single", ord: true, text: () => "Roughly how much of every ₹100 you earn goes to those?", opts: [{ v: 0, label: "₹0 to 2" }, { v: 5, label: "About ₹5" }, { v: 10, label: "About ₹10" }, { v: 15, label: "About ₹15" }, { v: 20, label: "About ₹20" }, { v: 30, label: "About ₹30" }, { v: 40, label: "About ₹40" }, { v: 50, label: "₹50 or more" }], why: "Compare with how many slices you ticked." },
    fixed: { fmt: "band", vals: FIXED, def: 3, money: true, text: () => "What are your fixed costs per month (rent, salaries, tools, your own pay) even if you sell nothing?", hint: "Include your own pay. Working for free is not a plan.", why: "Fixed costs are due on the 1st whether customers come or not." },
    biggerCost: { fmt: "pair", text: () => "Which will be bigger every month?", opts: [{ v: "product", label: "What it costs to make or deliver" }, { v: "selling", label: "What it costs to find and win customers" }], why: "Most founders guess the first. The second is often bigger." },
    "reveal:leaks": { fmt: "reveal", kind: "leaks" },

    // ---------- UNIT 5: will they come back? ----------
    selfFreq: { fmt: "single", ord: true, text: () => "How often would YOU buy this?", opts: FREQ_OPTS, why: "You are your best sample of one." },
    custFreq: { fmt: "single", ord: true, conf: true, text: () => "How often will your customers buy it?", opts: FREQ_OPTS, why: "If you expect more than you would do yourself, ask why." },
    comeback: { fmt: "multi", excl: "unsure", text: () => "What will bring customers back? Tick every reason.", opts: [{ v: "need", label: "They will need it again" }, { v: "habit", label: "It becomes a habit" }, { v: "trust", label: "They trust us" }, { v: "discount", label: "Discounts and offers" }, { v: "nochoice", label: "They have no other choice" }, { v: "remind", label: "We remind them" }, { v: "unsure", label: "I am not sure" }], why: "Discounts bring buyers. They rarely bring loyalty." },
    discountDep: { fmt: "reflex", seconds: 8, text: () => "Gut answer, 8 seconds: if I stop all discounts, customers will still buy.", opts: [{ v: true, label: "TRUE" }, { v: false, label: "FALSE" }], why: "Your quick answer, to be compared with a slow one." },
    m2: { fmt: "single", ord: true, text: () => "Of 100 customers who buy this month, how many buy again next month?", opts: pct([5, 10, 20, 30, 50, 70, 90]), why: "The first repeat is where most businesses leak." },
    m3: { fmt: "single", ord: true, text: () => "...and how many are still buying in month 3?", opts: pct([5, 10, 20, 30, 50, 70, 90]), why: "Retention only goes down." },
    m6: { fmt: "single", ord: true, text: () => "...and how many are still buying in month 6?", opts: pct([5, 10, 20, 30, 50, 70, 90]), why: "Whoever is left at month 6 is your real business." },
    cac: { fmt: "band", vals: CAC, def: 5, money: true, text: () => "What will it cost you to win ONE new customer (ads, discounts, commissions, your time)?", hint: "If you think it is zero, remember that free offers and your own time have a cost.", why: "A customer must be worth more than they cost to win." },
    discountDep2: { fmt: "pair", conf: true, text: () => "Think slowly. If you stopped all discounts tomorrow, sales would...", opts: [{ v: "same", label: "Stay about the same" }, { v: "drop", label: "Drop a lot" }], why: "Same fact as the earlier gut question, asked slowly." },
    "reveal:repeat": { fmt: "reveal", kind: "repeat" },

    // ---------- UNIT 6: stress test, then the castle ----------
    stress: { fmt: "multi", excl: "none", text: () => "Which of these could happen in your first six months? Tick every one that is possible.", opts: [{ v: "sales", label: "Sales 30% lower than planned" }, { v: "late", label: "Customers pay 15 days later" }, { v: "cost", label: "Costs 10% higher" }, { v: "advance", label: "Supplier demands payment in advance" }, { v: "returns", label: "Returns double" }, { v: "none", label: "None of these could happen" }], why: "Real businesses face several of these at once. We run your own numbers through them." },
    "reveal:stress": { fmt: "reveal", kind: "stress" },
    ledger: { fmt: "ledger", text: () => "For each number in your plan, how do you know it?", why: "A number you guessed and a number you checked look identical on paper. They are not." },
  };

  const units = [
    { id: 1, title: "Your idea, undressed", min: 8, finds: "How unique your idea really is.", items: ["nooneelse", "looked", "alts", "edge", "copy", "nooneelse2"], grp: [[3, 4]], prelude: [
      { h: "Nobody is paid for being unique", p: "Investors fund businesses that people pay for again and again. A unique idea nobody pays for is a hobby." },
      { h: "Most 'new' ideas already exist", p: "Before you raise a rupee, an investor will search for ten minutes. We search first, so you are not surprised." },
      { h: "This is a mirror, not a test", p: "On questions about you there are no right answers. We only check whether your answers agree with each other." }],
      story: { slot: true, theme: "A founder who believed 'nobody does this' when somebody already did", why: "Shows what happens when the search is skipped." } },
    { id: 2, title: "Walk one order", min: 9, finds: "Whether you can see your whole business chain.", items: ["chain", "knowDeliver", "payFirst", "firstCust", "fieldOps"], prelude: [
      { h: "A business is a chain", p: "Find a customer, take an order, make it, deliver it, collect the money, handle problems. Miss one link and the chain stops." },
      { h: "Ideas are cheap, operations are not", p: "Most students can describe the idea in one line and cannot describe a day of operations. Investors ask for the day." },
      { h: "Selling is a job", p: "Someone has to find customers, every day. 'They will find me' is not a plan." }],
      story: { title: "Webvan: building the whole chain before proving one link", body: ["Webvan, founded in 1996, set out to sell groceries online and deliver them itself. It built its own warehouses and delivery network from scratch.", "It went public in November 1999, raising $375 million, and placed a $1 billion order with Bechtel to build its warehouses. In 2000, its peak year, it had $178.5 million of sales against $525.4 million of expenses.", "It shut down in June 2001 and filed for bankruptcy in July 2001. Commentators point to expanding fast before proving the model in its first market, and to building every link of the chain itself."], teaches: "Every link in the chain costs money and time. Prove one link at small scale before you copy it everywhere.", source: { label: "Wikipedia: Webvan (figures as stated there; check its references)", url: "https://en.wikipedia.org/wiki/Webvan" } } },
    { id: 3, title: "The clock", min: 11, finds: "How long your money is stuck, and how much you really need.", items: ["price", "cut", "reveal:agg", "cost", "supTerms", "stockDays", "delivDays", "recvDays", "prepaid", "k1", "k2", "reveal:cycle"], grp: [], prelude: [
      { h: "Money is stuck in time", p: "A business does not run out of profit first. It runs out of cash, because money is tied up between paying and being paid." },
      { h: "Same sales, very different money needed", p: "Two businesses can sell the same amount. The one with the longer cycle needs several times more money to do it." },
      { h: "Your numbers, not ours", p: "You will set your own price, cost and days. Then we show what your own cycle needs." }],
      story: { title: "Dell: customers' money arrived before suppliers' bills", body: ["Dell's own filing (Form S-4/A, 2008) reports a negative cash conversion cycle: minus 43 days in fiscal 2006, minus 36 in fiscal 2008 and minus 29 at the end of the second quarter of fiscal 2009.", "Negative means Dell collected from customers before it had to pay suppliers. Between mid-2007 and mid-2008 the cycle became less negative, from minus 38 to minus 29 days. The filing attributes this to customers taking 3 days longer to pay and Dell paying suppliers 6 days sooner, and says Dell expected to stay between minus 20 and minus 30 days."], teaches: "Time, not just price, decides how much money a business needs. Shorten the days and the same business needs less cash.", source: { label: "Dell Form S-4/A (SEC), Key Performance Metrics", url: "https://www.sec.gov/Archives/edgar/data/0000826083/000095013408018573/d60133a2sv4za.htm" } } },
    { id: 4, title: "Money in, and the leaks", min: 10, finds: "What is really left after returns, bad debts and costs.", items: ["volume", "sellThrough", "returns", "badDebt", "leaks", "leakPct", "fixed", "biggerCost", "reveal:leaks"], grp: [[1, 2, 3]], prelude: [
      { h: "Revenue is not profit", p: "Revenue is what customers hand over. Profit is what is left after returns, unpaid bills, fees, wastage and rent." },
      { h: "Leaks are small and many", p: "Platform fees, packaging, delivery, ads, wastage. Each looks tiny. Together they often decide whether you earn or lose." },
      { h: "Fixed costs do not wait", p: "Rent and salaries are due even in a month with no sales." }],
      story: { slot: true, theme: "A business that looked profitable until hidden costs were counted", why: "Shows how small leaks decide survival." } },
    { id: 5, title: "Will they come back?", min: 11, finds: "Whether customers repeat, and what a customer is worth.", items: ["selfFreq", "custFreq", "comeback", "discountDep", "m2", "m3", "m6", "cac", "discountDep2", "reveal:repeat"], prelude: [
      { h: "A sale is not a business", p: "A business is a pattern of repeat sales. One-time sales mean starting from zero every month." },
      { h: "Discounts buy a first sale", p: "Discounts bring new buyers. The question is whether they come back when the discount stops." },
      { h: "A customer must be worth more than they cost", p: "If winning a customer costs more than they ever spend, growth makes you poorer." }],
      story: { title: "Groupon-style discounts: do merchants win?", body: ["In a paper first circulated in 2011 and published in Marketing Letters in 2016, Benjamin Edelman, Sonia Jaffe and Scott Duke Kominers studied whether deep-discount vouchers pay off for the merchants who offer them.", "Their conclusion: vouchers raise profits only under limited conditions. They work as price discrimination only if voucher buyers value the product less than regular customers, and firms that are patient, little-known or low-cost tend to gain more."], teaches: "A discount can buy a first sale. Whether it buys a second one is the question to answer before you spend investor money on it.", source: { label: "Edelman, Jaffe and Kominers: To Groupon or Not to Groupon", url: "https://www.benedelman.org/to-groupon-or-not-to-groupon-the-profitability-of-deep-discounts/" } } },
    { id: 6, title: "Stress test, then the castle", min: 11, finds: "Whether your plan survives a bad month, and how much of it is guesswork.", items: ["stress", "reveal:stress", "ledger"], prelude: [
      { h: "Plans meet a bad month", p: "Sales dip, customers pay late, costs rise. We run your own numbers through the bad month." },
      { h: "A castle in the air", p: "Every number in your plan is either tested or a guess. Guesses float. We show how many of yours do." },
      { h: "Be honest, it is private", p: "Nobody sees these answers but you, and honesty is what the score rewards." }],
      story: { slot: true, theme: "A company that was profitable on paper and ran out of cash", why: "Shows why peak cash need matters." } },
  ];


  // A sample founder, for demos and tests: open index.html#demo=results (or q:price, mirror:3, story:2, rebuild, mission, submit, fail, pass).
  PF.persona = () => {
    const A = (v, c) => ({ v, t: 1, ...(c ? { conf: c } : {}) });
    return { v: 1, screen: "q", profile: { name: "Aarav Mehta", startup: "KurtaKart" }, seed: PF.hash("aarav mehta|kurtakart"), daydream: 78, flavour: "ecom", shape: "seller", router: {}, mirror: {}, shown: [], u: 0, qi: 0, pi: 0, queue: {}, sub: null, t0: Date.now() - 23 * 60 * 1000, rebuild: {}, mission: {},
      ans: { nooneelse: A(true), looked: A(["google", "social"]), alts: A(2), edge: A("cheaper", 100), copy: A(true, 75), nooneelse2: A("several", 75),
        chain: A({ find: { who: "me", know: "no" }, order: { who: "me", know: "rough" }, make: { who: "nobody", know: "no" }, quality: { who: "nobody", know: "no" }, deliver: { who: "partner", know: "rough" }, collect: { who: "me", know: "yes" }, support: { who: "nobody", know: "no" } }), knowDeliver: A(true, 100), payFirst: A("customer"), firstCust: A("findme"), fieldOps: A("read"),
        price: A(500), cost: A(300), supTerms: A(0), stockDays: A(10), delivDays: A(5), recvDays: A(30), prepaid: A(true, 75), k1: A(true), k2: A("shorter"),
        volume: A(500), sellThrough: A(60), returns: A(10), badDebt: A(5), leaks: A(["platform", "ads"]), leakPct: A(10), fixed: A(50000), biggerCost: A("product"),
        selfFreq: A("year"), custFreq: A("month", 100), comeback: A(["discount"]), discountDep: A(true), m2: A(50), m3: A(30), m6: A(30), cac: A(100), discountDep2: A("drop", 75), stress: A(["sales", "late"]) },
      tags: { price: "guess", cost: "asked", supTerms: "guess", recvDays: "guess", volume: "guess", sellThrough: "guess", custFreq: "guess", cac: "guess" } };
  };

  PF.ITEMS = items; PF.UNITS = units; PF.PRICE = PRICE;
  PF.ctx = (S) => { const sh = PF.SHAPES[S.shape] || PF.SHAPES.seller; return { noun: sh.noun, stockQ: sh.stockQ, delivQ: sh.delivQ, S }; };
})();
