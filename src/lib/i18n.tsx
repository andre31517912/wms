"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type Lang = "en" | "zh";

const t = {
  // ── Nav / Layout ──
  wmsAdmin:           { en: "WMS Admin",           zh: "仓库管理" },
  orderPortal:        { en: "Order Portal",        zh: "订货平台" },
  orders:             { en: "Orders",              zh: "订单" },
  customers:          { en: "Customers",           zh: "客户" },
  productsAndItems:   { en: "Products & Items",    zh: "产品与规格" },
  import_:            { en: "Import",              zh: "导入" },
  catalog:            { en: "Catalog",             zh: "商品目录" },
  myOrders:           { en: "My orders",           zh: "我的订单" },
  cart:               { en: "Cart",                zh: "购物车" },
  backToAdmin:        { en: "← Back to admin",     zh: "← 返回管理" },
  signOut:            { en: "Sign out",            zh: "退出登录" },
  signingOut:         { en: "Signing out...",       zh: "退出中…" },

  // ── Auth ──
  signIn:             { en: "Sign in",             zh: "登录" },
  signingIn:          { en: "Signing in...",        zh: "登录中…" },
  warehouseOrdering:  { en: "Warehouse ordering system", zh: "仓库订货系统" },
  email:              { en: "Email",               zh: "邮箱" },
  password:           { en: "Password",            zh: "密码" },
  noAccount:          { en: "No account?",         zh: "没有账号？" },
  register:           { en: "Register",            zh: "注册" },
  createAccount:      { en: "Create account",      zh: "创建账号" },
  creatingAccount:    { en: "Creating account...", zh: "创建中…" },
  accountReviewNote:  { en: "Your account will be reviewed and approved by the supplier before you can place orders.",
                        zh: "您的账号将由供应商审核批准后方可下单。" },
  businessName:       { en: "Business / contact name", zh: "公司/联系人名称" },
  passwordHint:       { en: "At least 8 characters", zh: "至少8个字符" },
  alreadyHaveAccount: { en: "Already have an account?", zh: "已有账号？" },

  // ── Pending ──
  accountPending:     { en: "Account pending approval", zh: "账号待审批" },
  pendingMessage:     { en: "Thanks for registering, {name}. Your account is waiting for approval by the supplier. You'll be able to browse the catalog and place orders once it's approved.",
                        zh: "感谢注册，{name}。您的账号正在等待供应商审批，审批通过后即可浏览商品目录并下单。" },

  // ── Dashboard ──
  dashboard:          { en: "Dashboard",           zh: "控制台" },
  pendingOrders:      { en: "Pending orders",      zh: "待处理订单" },
  approvedCustomers:  { en: "Approved customers",  zh: "已批准客户" },
  pendingApprovals:   { en: "Pending approvals",   zh: "待审批" },
  products:           { en: "Products",            zh: "产品" },
  activeItems:        { en: "Active items",        zh: "在售规格" },
  lowStock:           { en: "Low stock",           zh: "库存偏低" },
  outOfStock:         { en: "Out of stock",        zh: "缺货" },

  // ── Sidebar / Dashboard extras ──
  inventory:          { en: "Inventory",           zh: "库存" },
  recentOrders:       { en: "Recent Orders",       zh: "最近订单" },
  stockAlerts:        { en: "Stock Alerts",        zh: "库存预警" },
  allProducts:        { en: "All Products",        zh: "所有产品" },
  allLevels:          { en: "All Levels",          zh: "所有等级" },
  healthy:            { en: "Healthy",             zh: "正常" },
  viewAll:            { en: "View all",            zh: "查看全部" },

  // ── Orders ──
  order:              { en: "Order",               zh: "订单" },
  placed:             { en: "Placed",              zh: "下单时间" },
  lines:              { en: "Lines",               zh: "行数" },
  cases:              { en: "Cases",               zh: "箱数" },
  status:             { en: "Status",              zh: "状态" },
  deliveryDate:       { en: "Delivery date",       zh: "交货日期" },
  delivery:           { en: "Delivery",            zh: "交货" },
  customer:           { en: "Customer",            zh: "客户" },
  allCustomers:       { en: "All customers",       zh: "所有客户" },
  from:               { en: "From",                zh: "起始" },
  to:                 { en: "To",                  zh: "截止" },
  filter:             { en: "Filter",              zh: "筛选" },
  clear:              { en: "Clear",               zh: "清除" },
  all:                { en: "All",                 zh: "全部" },
  noOrdersMatch:      { en: "No orders match these filters.", zh: "没有符合条件的订单。" },
  orderPlacedBanner:  { en: "Order placed! The supplier has been notified and will confirm it soon.",
                        zh: "订单已提交！供应商已收到通知，将尽快确认。" },
  toBeScheduled:      { en: "To be scheduled",     zh: "待安排" },
  total:              { en: "Total",               zh: "合计" },
  yourNote:           { en: "Your note",           zh: "备注" },
  customerNote:       { en: "Customer note",       zh: "客户备注" },
  updateStatus:       { en: "Update status",       zh: "更新状态" },
  orderHistory:       { en: "Order history →",     zh: "订单记录 →" },
  noOrdersYet:        { en: "No orders yet —",     zh: "暂无订单 —" },
  browseTheCatalog:   { en: "browse the catalog",  zh: "浏览商品目录" },

  // ── Order line table ──
  item:               { en: "Item",                zh: "规格" },
  sku:                { en: "SKU",                 zh: "货号" },
  piecesPerCase:      { en: "Pieces/case",         zh: "支/箱" },
  totalPieces:        { en: "Total pieces",        zh: "总支数" },

  // ── Order status ──
  statusPending:      { en: "Pending",             zh: "待确认" },
  statusConfirmed:    { en: "Confirmed",           zh: "已确认" },
  statusOutForDelivery: { en: "Out for delivery",  zh: "配送中" },
  statusDelivered:    { en: "Delivered",           zh: "已送达" },
  statusCancelled:    { en: "Cancelled",           zh: "已取消" },

  // ── Order status controls ──
  current:            { en: "(current)",           zh: "（当前）" },
  updating:           { en: "Updating...",          zh: "更新中…" },
  cancelOrderRestore: { en: "Cancel order (restores stock)", zh: "取消订单（恢复库存）" },
  reinstateOrder:     { en: "Reinstate order (re-deducts stock)", zh: "恢复订单（重新扣减库存）" },
  setTo:              { en: "Set to {status}",     zh: "设为{status}" },
  cancellingNote:     { en: "Cancelling returns all cases in this order to stock.",
                        zh: "取消订单将把该订单中的所有箱数退回库存。" },
  reinstatingNote:    { en: "Reinstating takes the cases back out of stock — it will fail if stock has since run out.",
                        zh: "恢复订单将重新从库存中扣除箱数——如果库存不足将会失败。" },

  // ── Customers ──
  name:               { en: "Name",                zh: "名称" },
  registered:         { en: "Registered",          zh: "注册时间" },
  history:            { en: "History",             zh: "记录" },
  actions:            { en: "Actions",             zh: "操作" },
  noCustomersYet:     { en: "No customer accounts yet. Customers can self-register at /register.",
                        zh: "暂无客户账号。客户可在 /register 自行注册。" },
  accountPENDING:     { en: "PENDING",             zh: "待审批" },
  accountAPPROVED:    { en: "APPROVED",            zh: "已批准" },
  accountDISABLED:    { en: "DISABLED",            zh: "已禁用" },

  // ── Products & Items ──
  addItem:            { en: "Add item",            zh: "添加规格" },
  createProductFirst: { en: "Create a product first (Products page), then add items under it.",
                        zh: "请先创建产品（产品页），再在其下添加规格。" },
  createItem:         { en: "Create item",         zh: "创建规格" },

  // ── Item detail ──
  currentStock:       { en: "Current stock",       zh: "当前库存" },
  casesUnit:          { en: "cases",               zh: "箱" },
  inStock:            { en: "In stock",            zh: "有货" },
  adjustStock:        { en: "Adjust stock",        zh: "调整库存" },
  batchInventory:     { en: "Batch inventory",     zh: "批次库存" },
  fifoNote:           { en: "(FIFO — oldest first)", zh: "（先进先出）" },
  photos:             { en: "Photos",              zh: "照片" },
  itemDetails:        { en: "Item details",        zh: "规格详情" },
  stockHistory:       { en: "Stock history",       zh: "库存记录" },
  globalStockHistory: { en: "Stock History",       zh: "库存变动记录" },
  totalUnits:         { en: "Total units in warehouse", zh: "仓库总库存" },
  totalMovements:     { en: "Total movements",     zh: "总变动次数" },
  totalIn:            { en: "Total in",            zh: "总入库" },
  totalOut:           { en: "Total out",           zh: "总出库" },
  orderReason:        { en: "Order",               zh: "订单扣减" },
  orderCancelledReason: { en: "Order cancelled",   zh: "取消订单恢复" },
  noStockMovements:   { en: "No stock movements yet.", zh: "暂无库存变动记录。" },
  saveChanges:        { en: "Save changes",        zh: "保存更改" },
  batch:              { en: "Batch",               zh: "批次" },
  received:           { en: "Received",            zh: "入库时间" },
  remaining:          { en: "Remaining",           zh: "剩余" },
  date:               { en: "Date",                zh: "日期" },
  note:               { en: "Note",                zh: "备注" },
  when:               { en: "When",                zh: "时间" },
  change:             { en: "Change",              zh: "变动" },
  reason:             { en: "Reason",              zh: "原因" },
  by:                 { en: "By",                  zh: "操作人" },

  // ── Cart ──
  cartEmpty:          { en: "Your cart is empty —", zh: "购物车为空 —" },
  kgTotal:            { en: "~ {n} kg total",      zh: "约 {n} 公斤" },

  // ── Import ──
  bulkImport:         { en: "Bulk import",         zh: "批量导入" },
  importDescription:  { en: "Upload a spreadsheet (.xlsx or .csv). You can map each column to the right field before importing. Existing items are matched by SKU (or name within product) and updated; new ones are created. Always preview before importing.",
                        zh: "上传电子表格（.xlsx 或 .csv）。导入前可将每列映射到对应字段。已有规格按货号（或产品内名称）匹配更新，新规格自动创建。请务必先预览再导入。" },
  readColumns:        { en: "Read columns",        zh: "读取列" },
  reading:            { en: "Reading...",           zh: "读取中…" },
  mapColumnsToFields: { en: "Map columns to fields", zh: "列与字段映射" },
  columnsDetected:    { en: "{n} columns detected", zh: "检测到 {n} 列" },
  dataRows:           { en: "{n} data rows",       zh: "{n} 行数据" },
  headerOnRow:        { en: "header on row {n}",   zh: "表头在第 {n} 行" },
  empty:              { en: "(empty)",             zh: "（空）" },
  skip:               { en: "— skip —",            zh: "— 跳过 —" },
  selectItemName:     { en: "Select which spreadsheet column contains the item name below to continue.",
                        zh: "请在下方选择包含规格名称的电子表格列以继续。" },
  preview:            { en: "Preview",             zh: "预览" },
  working:            { en: "Working...",           zh: "处理中…" },
  importNow:          { en: "Import now",          zh: "立即导入" },
  importing:          { en: "Importing...",         zh: "导入中…" },
  startOver:          { en: "Start over",          zh: "重新开始" },
  backToMapping:      { en: "Back to mapping",     zh: "返回映射" },
  importAnother:      { en: "Import another file", zh: "导入其他文件" },
  editBeforeImport:   { en: "Edit any cell below before importing. Nothing is saved yet.",
                        zh: "导入前可编辑下方任意单元格，目前尚未保存。" },
  skippedRows:        { en: "Skipped rows",        zh: "跳过的行" },
  done:               { en: "Done",                zh: "完成" },

  // ── Import field labels ──
  fldProduct:         { en: "Product (grouping)",  zh: "产品（分组）" },
  fldSku:             { en: "SKU / Code",          zh: "货号" },
  fldName:            { en: "Item name",           zh: "规格名称" },
  fldDetail:          { en: "Detail / Spec",       zh: "描述/规格" },
  fldWeight:          { en: "Weight (g)",          zh: "重量 (g)" },
  fldPiecesPerCase:   { en: "Pieces/case",         zh: "支/箱" },
  fldCaseLength:      { en: "Case length (cm)",    zh: "箱长 (cm)" },
  fldCaseWidth:       { en: "Case width (cm)",     zh: "箱宽 (cm)" },
  fldCaseHeight:      { en: "Case height (cm)",    zh: "箱高 (cm)" },
  fldMinOrder:        { en: "Min order (cases)",   zh: "最低订量 (箱)" },
  fldStock:           { en: "Stock (cases)",       zh: "库存 (箱)" },

  // ── Preview table headers ──
  colRow:             { en: "#",                   zh: "#" },
  colProduct:         { en: "Product",             zh: "产品" },
  colItemName:        { en: "Item Name",           zh: "规格名称" },
  colSku:             { en: "SKU",                 zh: "货号" },
  colDetail:          { en: "Detail",              zh: "描述" },
  colWeight:          { en: "Wt(g)",               zh: "重量(g)" },
  colPcsCase:         { en: "Pcs/Case",            zh: "支/箱" },
  colL:               { en: "L(cm)",               zh: "长(cm)" },
  colW:               { en: "W(cm)",               zh: "宽(cm)" },
  colH:               { en: "H(cm)",               zh: "高(cm)" },
  colMinOrd:          { en: "Min Ord",             zh: "最低订量" },
  colStock:           { en: "Stock",               zh: "库存" },
  colAction:          { en: "Action",              zh: "操作" },

  // ── Import action badges ──
  actionCreate:       { en: "create",              zh: "新建" },
  actionUpdate:       { en: "update",              zh: "更新" },
  actionError:        { en: "error",               zh: "错误" },

  // ── Result table headers ──
  row:                { en: "Row",                 zh: "行" },
  product:            { en: "Product",             zh: "产品" },
  action:             { en: "Action",              zh: "操作" },
  detail:             { en: "Detail",              zh: "详情" },

  // ── Misc ──
  placeOrder:         { en: "Place order",         zh: "提交订单" },
  placingOrder:       { en: "Placing order...",     zh: "提交中…" },
  approve:            { en: "Approve",             zh: "批准" },
  disable:            { en: "Disable",             zh: "禁用" },
  enable:             { en: "Enable",              zh: "启用" },
  items:              { en: "items",               zh: "项" },
  nItems:             { en: "{n} item(s)",         zh: "{n} 项" },
  nCases:             { en: "{n} cases",           zh: "{n} 箱" },

  // ── Cart / Catalog extras ──
  update:             { en: "Update",              zh: "更新" },
  remove:             { en: "Remove",              zh: "移除" },
  onlyNCasesInStock:  { en: "Only {n} case(s) in stock", zh: "库存仅剩 {n} 箱" },
  minOrderIs:         { en: "Minimum order is {n} cases", zh: "最低订量为 {n} 箱" },
  noLongerAvailable:  { en: "No longer available — remove this line", zh: "已下架——请移除此项" },
  supplierNote:       { en: "Note for the supplier (optional)", zh: "给供应商的备注（可选）" },
  deliveryPlaceholder:{ en: "Delivery instructions, preferred date...", zh: "配送说明、期望日期…" },
  stockReservedNote:  { en: "Stock is reserved when the order is placed. The supplier will confirm and schedule delivery.",
                        zh: "下单后库存即被预留，供应商将确认并安排配送。" },
  searchCatalog:      { en: "Search the catalog...", zh: "搜索商品…" },
  noSearchMatch:      { en: "Nothing matches your search.", zh: "未找到匹配商品。" },
  catalogEmpty:       { en: "The catalog is empty right now.", zh: "商品目录暂无商品。" },
  nSizes:             { en: "{n} size(s)",         zh: "{n} 种规格" },
  addToCart:           { en: "Add to cart",         zh: "加入购物车" },
  adding:             { en: "Adding...",            zh: "添加中…" },
  currentlyUnavailable: { en: "Currently unavailable", zh: "暂时缺货" },
  caseUnit:           { en: "case(s)",             zh: "箱" },
  minOrder:           { en: "Min order",           zh: "最低订量" },
  prev:               { en: "← Prev",             zh: "← 上一张" },
  next:               { en: "Next →",              zh: "下一张 →" },

  // ── Products explorer ──
  searchPlaceholder:  { en: "Search products, items, SKUs...", zh: "搜索产品、规格、货号…" },
  addProduct:         { en: "+ Add product",       zh: "+ 添加产品" },
  close:              { en: "Close",               zh: "关闭" },
  noProductsYet:      { en: "No products yet — add one above or use the bulk import.",
                        zh: "暂无产品——请在上方添加或使用批量导入。" },
  noItemsUnderProduct:{ en: "No items under this product yet.", zh: "该产品下暂无规格。" },
  sortOrder:          { en: "Sort order",          zh: "排序" },
  sort:               { en: "Sort",                zh: "排序" },
  add:                { en: "Add",                 zh: "添加" },
  save:               { en: "Save",                zh: "保存" },
  cancel:             { en: "Cancel",              zh: "取消" },
  edit:               { en: "Edit",                zh: "编辑" },
  delete_:            { en: "Delete",              zh: "删除" },
  moveOrDeleteFirst:  { en: "Move or delete its items first", zh: "请先移动或删除其下的规格" },
  inactive:           { en: "Inactive",            zh: "未激活" },
  caseDimsCm:         { en: "Case dims (cm)",      zh: "箱尺寸 (cm)" },
  stockCases:         { en: "Stock (cases)",       zh: "库存 (箱)" },
  nItemsCount:        { en: "{n} item(s)",         zh: "{n} 个规格" },

  // ── Stock adjust form ──
  casesReceiveRemove: { en: "Cases (+ receive / − remove)", zh: "箱数（+ 入库 / − 出库）" },
  casesPlaceholder:   { en: "e.g. 50 or -3",      zh: "如 50 或 -3" },
  receiving:          { en: "Receiving",           zh: "入库" },
  correction:         { en: "Correction",          zh: "修正" },
  damage:             { en: "Damage",              zh: "损耗" },
  apply:              { en: "Apply",               zh: "应用" },
  saving:             { en: "Saving...",            zh: "保存中…" },

  // ── Item form labels ──
  productRequired:    { en: "Product *",           zh: "产品 *" },
  selectProduct:      { en: "Select product...",   zh: "选择产品…" },
  skuItemCode:        { en: "SKU / item code",     zh: "货号" },
  nameRequired:       { en: "Name *",              zh: "名称 *" },
  detailSpec:         { en: "Detail / spec",       zh: "描述/规格" },
  unitWeightG:        { en: "Unit weight (g)",     zh: "单重 (g)" },
  piecesPerCaseReq:   { en: "Pieces per case *",   zh: "支/箱 *" },
  minOrderCases:      { en: "Min order (cases)",   zh: "最低订量 (箱)" },
  lowStockThreshold:  { en: "Low-stock threshold", zh: "低库存阈值" },
  caseDimensionsCm:   { en: "Case dimensions (cm)",zh: "箱尺寸 (cm)" },
  activeVisible:      { en: "Active (visible to customers)", zh: "激活（对客户可见）" },

  // ── Delete item ──
  deleteItem:         { en: "Delete item",         zh: "删除规格" },
  deleting:           { en: "Deleting...",          zh: "删除中…" },
  confirmDelete:      { en: "Confirm delete",      zh: "确认删除" },

  // ── Item photos ──
  noPhotosYet:        { en: "No photos yet. The first photo becomes the main image customers see.",
                        zh: "暂无照片。第一张照片将成为客户看到的主图。" },
  main:               { en: "Main",                zh: "主图" },
  makeMain:           { en: "Make main",           zh: "设为主图" },
  uploading:          { en: "Uploading...",         zh: "上传中…" },
  upload:             { en: "Upload",              zh: "上传" },
  photoLimits:        { en: "Up to 6 photos, JPEG/PNG/WebP/GIF, max 8 MB each — resized automatically",
                        zh: "最多6张照片，支持 JPEG/PNG/WebP/GIF，每张最大8MB——自动调整大小" },
} as const;

export type TKey = keyof typeof t;

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "wms-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "zh" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const translate = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      const entry = t[key];
      let str: string = entry[lang];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      className="rounded-md border border-admin-input-border px-2 py-1 text-xs font-medium text-admin-text-secondary hover:bg-admin-surface-hover"
      title={lang === "en" ? "切换中文" : "Switch to English"}
    >
      {lang === "en" ? "中文" : "EN"}
    </button>
  );
}
