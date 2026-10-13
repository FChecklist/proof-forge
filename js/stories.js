/* Real startup stories. Each one is in our own words, every fact comes from the source named under it, and none is invented.
   A round with no story here simply has no story screen: we never show a placeholder. Add a story only after reading its source. */
(function () {
  const PF = window.PF, S = (id, title, body, teaches, label, url) => ({ id, title, body, teaches, source: { label, url } });
  const BY = {
    "1.6": S("wework", "WeWork: a profit number that left out the real costs", [
      "In August 2019 WeWork filed to go public. Its filing showed a profit measure, called contribution margin, that left out major costs such as sales and marketing, general and administrative costs, pre-opening costs and depreciation.",
      "Counting everything, WeWork's 2018 revenue was about $1.82 billion and its net loss was about $1.93 billion. The company withdrew the filing in September 2019."],
      "A profit figure that skips real costs is not profit. List every leak before you call a number profit.", "WeWork Form S-1, US SEC, August 2019", "https://www.sec.gov/Archives/edgar/data/1533523/000119312519220499/d781982ds1.htm"),
    "2.1": S("olpc", "One Laptop per Child: loved by users, bought by governments", [
      "One Laptop per Child aimed to give children a laptop for about $100. The children were the users, but the buyers were governments, through their education ministries.",
      "Orders came in far below the millions the project had hoped for, and the price stayed near $200. India's education ministry turned the project down in 2006, saying public money was needed for established needs."],
      "The person who loves the product may not be the person who decides or pays. Test the payer separately from the user.", "MIT Technology Review, 11 Jan 2008, and Wikipedia", "https://www.technologyreview.com/2008/01/11/128330/laptop-program-to-intel-good-riddance/"),
    "2.3": S("cydoc", "Cydoc: doctors said \"nice\", then made excuses at the price", [
      "Rachel Draelos, a doctor and AI researcher, ran Cydoc, a health-AI tool, alone from 2018 to 2025. Friends in medicine liked the idea, but she did not ask anyone for impartial feedback or for money in advance.",
      "Later, doctors often said they liked the product but made excuses when asked to subscribe. At its peak the company had four paying customers. She pitched more than 35 venture firms, none invested, and she shut it down in August 2025."],
      "Polite interest is not demand. Only money, a signed commitment or real time spent counts.", "Rachel Draelos, Glass Box Medicine, 21 Feb 2026 (her own account)", "https://glassboxmedicine.com/2026/02/21/why-i-shut-down-my-bootstrapped-health-ai-startup-after-7-years-a-founders-postmortem/"),
    "3.1": S("coolestcooler", "Coolest Cooler: the factory work nobody had planned", [
      "In 2014 Ryan Grepper's Coolest Cooler raised about $13.3 million on Kickstarter from more than 62,000 backers. Delivery was promised for early 2015 and slipped by months.",
      "Production, shipping and certification took far longer and cost more than expected, and Grepper said the pledge levels did not cover the final quality. Production stopped in 2016, and the company ended operations in December 2019 with thousands of backers unfulfilled."],
      "The idea is the small part. Making, shipping and servicing it is most of the job. List every job before you set a price.", "Wikipedia, with reporting from Vice (2016) and The Register (2019)", "https://en.wikipedia.org/wiki/Coolest_Cooler"),
    "3.2": S("loudcloud", "Loudcloud: loyal friends who needed a boss above them", [
      "When Ben Horowitz started Loudcloud, he hired people he knew, respected and trusted. Many lacked deep experience in their roles but worked relentlessly.",
      "The trouble came when a role needed someone more experienced than a loyal friend. He wrote that the way through is to put the company's needs first, decide firmly, be honest, and say the change is about the future, not past performance."],
      "Friends are easy to hire and hard to manage, replace or put under someone else. Decide the roles before you pick the people.", "Ben Horowitz, \"Demoting A Loyal Friend\", a16z, 24 Apr 2012", "https://a16z.com/demoting-a-loyal-friend/"),
    "3.4": S("clinkle", "Clinkle: $25 million, and a product the public had not seen", [
      "In June 2013 the mobile-wallet startup Clinkle announced a $25 million round from more than 18 investors. The app had not been launched to the public. It had only been through a small beta at Stanford.",
      "Asked about the money, the founder said most of it would go towards hiring, and he would not give a date for a public release. Reporting later said the team shrank sharply and the company was shut by 2016."],
      "Be able to say what each rupee buys and what it proves. \"Most of it will go to hiring\" is not a use of funds.", "TechCrunch, 27 Jun 2013", "https://techcrunch.com/2013/06/27/clinkle-raises-celebrity-filled-25m-round-as-it-gears-up-to-eliminate-the-physical-wallet/"),
    "4.1": S("homejoy", "Homejoy: customers came for $19, then stopped booking", [
      "The home-cleaning startup Homejoy priced a first clean at $19, far below the usual price. Many customers who arrived through deal sites stopped booking once prices went back to normal.",
      "Homejoy said worker-classification lawsuits were the deciding factor when it shut down in July 2015. Press reports also put heavy losses and poor customer retention at the heart of the problem. A rival, Handy, said most of its bookings came from existing customers."],
      "Discounts buy visits, not loyalty. Check how many customers return at full price before you spend more on discounts.", "Fortune, 2 Nov 2015, and Wikipedia", "https://fortune.com/2015/11/02/handy-50-million/"),
    "4.2": S("fab", "Fab: fast growth, cash gone, no break-even", [
      "Fab turned from a social network into a design flash-sale site in 2011 and raised about $336 million over 11 rounds. In an October 2013 memo to executives, its CEO wrote that the company had spent about $200 million and had not proven its business model, citing growth that was too fast, marketing before the offer was right, and overspending abroad.",
      "It cut jobs in 2013 and was sold in March 2015 for a reported $15 million."],
      "Growth is not progress until each sale makes money. Know your break-even before you spend to grow.", "SiliconANGLE, 3 Mar 2015, and the CEO's memo as published online", "https://siliconangle.com/2015/03/03/the-spin-stopped-here-fab-com-sold-in-epic-fire-sale-to-pch-for-15-million/"),
  };
  PF.STEPS.forEach((s) => s.units.forEach((u, i) => { const k = s.id + "." + (i + 1); if (BY[k]) u.story = BY[k]; else if (u.story && u.story.slot) delete u.story; }));
  PF.STORIES = BY;
})();
