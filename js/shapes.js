/* The idea shapes and the 30 business flavours students pick from. All flavours run on the same engine; the shape decides the wording and the tests. */
(function () {
  const PF = (window.PF = window.PF || {});
  PF.SHAPES = {
    aggregator: { name: "Aggregator or platform", noun: "order", cut: true, stockQ: "How many days between taking an order and paying the supplier or provider?", delivQ: "How many days from the order to the customer receiving it?" },
    seller: { name: "Seller (stock-based)", noun: "item", stockQ: "How many days will stock sit before it sells?", delivQ: "How many days from the customer's order to delivery?" },
    maker: { name: "Maker or manufacturer", noun: "unit", stockQ: "How many days from buying raw material to a finished unit ready to sell?", delivQ: "How many days from the customer's order to delivery?" },
    outlet: { name: "Food or outlet", noun: "plate", stockQ: "How many days will ingredients or stock sit before they are used or sold?", delivQ: "How many days from order to the customer being served?" },
    service: { name: "Service business", noun: "job", stockQ: "How many days of preparation, travel or set-up before a job can be charged?", delivQ: "How many days from booking to the job being finished?" },
    digital: { name: "App, software or subscription", noun: "paying user-month", stockQ: "How many days of free trial or set-up before a user starts paying?", delivQ: "How many days from sign-up to the user getting full value?" },
    content: { name: "Content, courses or community", noun: "paid sale", stockQ: "How many days of making content before it can be sold?", delivQ: "How many days from payment to the customer getting what they paid for?" },
    heavy: { name: "Capital-heavy business", noun: "unit", stockQ: "How many days from spending money to having something sellable?", delivQ: "How many days from the order to delivery or installation?" },
  };
  const F = (id, label, shape) => ({ id, label, shape });
  PF.FLAVOURS = [
    F("ecom", "Online store or e-commerce site", "seller"), F("reseller", "Reseller or trader", "seller"), F("fashion", "Fashion or lifestyle brand", "seller"), F("retail", "Offline shop or franchise", "seller"),
    F("agri", "Agri or farm-to-consumer", "seller"), F("export", "Import-export or wholesale", "seller"),
    F("market", "Marketplace or on-demand platform", "aggregator"), F("clone", "'Uber or Swiggy for X'", "aggregator"), F("directory", "Price comparison or directory", "aggregator"),
    F("maker", "Maker or manufacturer", "maker"), F("fmcg", "Packaged food or FMCG brand", "maker"), F("gadget", "Hardware or gadget", "maker"),
    F("food", "Food outlet or cloud kitchen", "outlet"),
    F("local", "Local services (tutor, repair, salon)", "service"), F("b2b", "B2B services or agency", "service"), F("health", "Health, wellness or fitness", "service"), F("events", "Events, travel or experiences", "service"), F("impact", "Social-impact venture", "service"),
    F("app", "App or software", "digital"), F("ai", "AI product or 'wrapper'", "digital"), F("sub", "Subscription box or membership", "digital"), F("game", "Gaming or esports", "digital"), F("fintech", "Fintech", "digital"), F("crypto", "Crypto or Web3", "digital"),
    F("edtech", "EdTech, courses or coaching", "content"), F("creator", "Creator, media or content", "content"), F("social", "Social network or community", "content"),
    F("clean", "Cleantech, EV, waste or solar", "heavy"), F("estate", "Real estate or co-living", "heavy"),
    F("pure", "Pure idea, no customer yet", "router"),
  ];
  // The router for "pure idea": three taps pick the nearest shape.
  PF.ROUTER = [
    { id: "r1", text: "Who will pay you?", opts: [["consumers", "Individual customers"], ["business", "Other businesses"], ["ads", "Advertisers or sponsors"], ["nobody", "Nobody has agreed to pay yet"]] },
    { id: "r2", text: "What will they pay for?", opts: [["product", "A physical product"], ["service", "A service done by people"], ["software", "Access to an app or software"], ["content", "Attention, content or learning"], ["connect", "Connecting two sides (buyers and sellers)"]] },
    { id: "r3", text: "How often will the same person pay?", opts: [["once", "Once"], ["often", "Again and again"], ["unknown", "I have not thought about it"]] },
  ];
  PF.routeShape = (a) => ({ product: "seller", service: "service", software: "digital", content: "content", connect: "aggregator" }[a.r2] || "seller");
})();
