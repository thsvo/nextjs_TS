/* eslint-disable @typescript-eslint/no-explicit-any */
// Typed wrapper around every Pantrix backend endpoint.
// All calls use the shared axios instance (which carries the JWT).

import axios from '../utils/axios';

// ── Auth ─────────────────────────────────────────────────────────────────

export type LoginResponse = {
  username: string;
  role: 'admin' | 'client';
  restaurant_id: number;
  token: string;
  allowed_pages: string[];
  allowed_page_labels: string[];
  client_visible_pages: string[];
  client_visible_labels: string[];
};

export const login = (username: string, password: string) =>
  axios.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data);

// ── Client page settings ─────────────────────────────────────────────────

export type ClientPageSettings = {
  pages: string[];
  labels: string[];
  configurable_pages: string[];
  configurable_labels: string[];
};

export const getClientPageSettings = () =>
  axios.get<ClientPageSettings>('/client-page-settings').then((r) => r.data);

export const saveClientPageSettings = (pages: string[]) =>
  axios.post('/client-page-settings', { pages }).then((r) => r.data);

// ── Admin ────────────────────────────────────────────────────────────────

export type Restaurant = {
  id: number;
  name: string;
  group_name: string;
  is_active: boolean;
  created_at: string;
};

export type AppUser = {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export const listRestaurants = () =>
  axios.get<{ restaurants: Restaurant[] }>('/admin/restaurants').then((r) => r.data.restaurants);

export const createRestaurant = (name: string, group_name = '') =>
  axios.post('/admin/restaurants', { name, group_name }).then((r) => r.data);

export const deleteRestaurant = (id: number) =>
  axios.delete(`/admin/restaurants/${id}`).then((r) => r.data);

export const listUsers = (restaurant_id?: number) =>
  axios
    .get<{ users: AppUser[] }>('/admin/users', { params: { restaurant_id } })
    .then((r) => r.data.users);

export const createUser = (
  restaurant_id: number,
  username: string,
  password: string,
  role: 'admin' | 'client' = 'client'
) => axios.post('/admin/users', { restaurant_id, username, password, role }).then((r) => r.data);

export const setUserPassword = (username: string, new_password: string) =>
  axios.post('/admin/users/set-password', { username, new_password }).then((r) => r.data);

export const deleteUser = (user_id: number) =>
  axios.delete(`/admin/users/${user_id}`).then((r) => r.data);

// ── Menu & Recipe mapping ────────────────────────────────────────────────

export const getMenuItems = () =>
  axios.get<{ items: string[] }>('/menu-items').then((r) => r.data.items);

export type PrepopulateMenuItem = {
  menu_item: string;
  is_std: boolean;
  is_existing: boolean;
};

export const getPrepopulateMenuItems = () =>
  axios
    .get<{ items: PrepopulateMenuItem[] }>('/prepopulate-menu-items')
    .then((r) => r.data.items);

export type PrepopulateRecipeRow = {
  ingredient: string;
  category: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  quantity: number;
  unit: string;
  origin_id: string;
};

export const getPrepopulateRecipe = (menu_item: string) =>
  axios
    .get<{ rows: PrepopulateRecipeRow[] }>('/prepopulate-recipe', { params: { menu_item } })
    .then((r) => r.data.rows);

export type RecipeMappingItem = {
  category: string;
  menu_item: string;
  unique_code: string;
  mapped_rows: number;
  is_mapped: boolean;
};

export type RecipeMappingSheet = {
  items: RecipeMappingItem[];
  unmapped_items: string[];
  ingredients: { category: string; ingredient: string }[];
  counts: { menu_items: number; mapped_menu_items: number; unmapped_menu_items: number };
  [key: string]: any; // dim_data extras
};

export const getRecipeMappingSheet = (search?: string) =>
  axios
    .get<RecipeMappingSheet>('/recipe-mapping-sheet', { params: { search, page_size: 500 } })
    .then((r) => r.data);

export type RecipeMappingDetailRow = {
  ingredient: string;
  type1: string;
  subvariant: string;
  type2: string;
  form: string;
  origin_id: string;
  ingredient_category: string;
  quantity: number;
  unit: string;
};

export type RecipeMappingDetails = {
  menu_item: string;
  category: string;
  rows: RecipeMappingDetailRow[];
};

export const getRecipeMappingDetails = (menu_item: string) =>
  axios
    .get<RecipeMappingDetails>('/recipe-mapping-details', { params: { menu_item } })
    .then((r) => r.data);

export type RecipeMappingSaveRow = {
  ingredient: string;
  quantity: number;
  unit?: string;
  type1?: string;
  subvariant?: string;
  type2?: string;
  form?: string;
  variant?: string;
  storage?: string;
  origin_id?: string;
};

export const saveRecipeMapping = (menu_item: string, rows: RecipeMappingSaveRow[]) =>
  axios.post('/recipe-mapping-save', { menu_item, rows }).then((r) => r.data);

// ── Ingredients ──────────────────────────────────────────────────────────

export type IngredientCreate = {
  ingredient: string;
  category?: string;
  variant?: string;
  subvariant?: string;
  storage?: string;
  form?: string;
  origin_id?: string;
  unit: string;
  quantity?: number;
  type1?: string;
  type2?: string;
};

export const addIngredient = (body: IngredientCreate) =>
  axios.post('/ingredients/add', body).then((r) => r.data);

export const getIngredients = () =>
  axios.get<{ ingredients: any[] }>('/ingredients').then((r) => r.data.ingredients);

export type IngredientUsedRow = {
  category: string;
  ingredient: string;
  storage: string;
  type: string;
  unit: string;
  level_at_full: number;
  origin_id: string;
  [k: string]: any;
};

export const getIngredientsUsed = () =>
  axios.get<{ rows: IngredientUsedRow[] }>('/ingredients-used').then((r) => r.data.rows);

export const updateIngredientLevel = (ingredient: string, level_at_full: number) =>
  axios
    .post('/ingredients-used/update-level', { ingredient, level_at_full })
    .then((r) => r.data);

export const toggleIngredientHide = (ing_uid: string, hidden: boolean) =>
  axios.post('/toggle-ingredient-hide', { ing_uid, hidden }).then((r) => r.data);

export const deleteIngredient = (ing_uid: string) =>
  axios.delete('/admin/delete-ingredient', { params: { ing_uid } }).then((r) => r.data);

// ── Uploads ──────────────────────────────────────────────────────────────

const uploadForm = (endpoint: string, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios
    .post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

export const uploadIngredientData = (file: File) => uploadForm('/upload-ingredient-data', file);
export const uploadMenuRecipeData = (file: File) => uploadForm('/upload-menu-recipe-data', file);
export const uploadStandardRecipeMapping = (file: File) =>
  uploadForm('/upload-standard-recipe-mapping', file);
export const uploadMenuData = (file: File) => uploadForm('/upload-menu-data', file);
export const uploadRecipeMappingData = (file: File) => uploadForm('/upload-recipe-mapping-data', file);
export const uploadPos = (file: File) => uploadForm('/upload-pos', file);
export const uploadRestock = (file: File) => uploadForm('/upload-restock', file);

// ── Restock ──────────────────────────────────────────────────────────────

export type RestockSheetRow = {
  category: string;
  ingredient: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  unit: string;
  origin_id: string;
  portion_size: number | null;
  portion_unit: string;
  current_balance: number;
  Ing_UID?: string;
};

export const getRestockSheetIngredients = () =>
  axios.get<{ rows: RestockSheetRow[] }>('/restock-sheet-ingredients').then((r) => r.data.rows);

export type ManualAddOption = {
  ingredient: string;
  category: string;
  unit: string;
  subvariant: string;
  form: string;
};

export type ManualAddOptions = {
  ingredients: ManualAddOption[];
  ingredient_list_mapping: { category: string; variant: string; storage: string }[];
  category_ingredient: { category: string; ingredient: string }[];
  category_variant: { category: string; variant: string }[];
  category_subvariant: { category: string; subvariant: string }[];
  category_form: { category: string; storage: string }[];
  category_preparation: { category: string; form: string }[];
  preparation_unit: { form: string; default_unit: string }[];
  unit_conversion: { default_unit: string; sub_unit: string; conversion_unit: number }[];
  unit_display: { default_unit: string; display_unit: string }[];
};

export const getRestockManualAddOptions = () =>
  axios.get<ManualAddOptions>('/restock-manual-add-options').then((r) => r.data);

export const restockManual = (body: {
  ingredient: string;
  category?: string;
  variant?: string;
  subvariant?: string;
  storage?: string;
  form?: string;
  origin_id?: string;
  unit: string;
  quantity: number;
  total_cost?: number | null;
  date?: string;
}) => axios.post('/restock-manual', body).then((r) => r.data);

export const restockManualAddIngredient = (body: {
  ingredient: string;
  category?: string;
  variant: string;
  subvariant?: string;
  storage: string;
  form?: string;
  origin_id?: string;
  unit: string;
  current_balance: number;
  date?: string;
  quantity_added: number;
  cost_of_ingredient?: number | null;
}) => axios.post('/restock-manual-add-ingredient', body).then((r) => r.data);

// ── Stock take ───────────────────────────────────────────────────────────

export type StockTakeIngredient = {
  category: string;
  ingredient: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  unit: string;
  current_balance: number;
  stock_taking_balance?: number;
  ing_uid?: string;
  portion_uid?: string;
  [k: string]: any;
};

export type StockTakeType = 'base' | 'portioning';

export const getStockTakeIngredients = (type: StockTakeType = 'base') =>
  axios
    .get<{ ingredients: StockTakeIngredient[] }>('/stock-take-ingredients', { params: { type } })
    .then((r) => r.data.ingredients);

export const stockTakeSave = (items: any[], date?: string, type: StockTakeType = 'base') =>
  axios.post('/stock-take-save', { items, date, type }).then((r) => r.data);

// ── Portioning ───────────────────────────────────────────────────────────

export const getPortioningSheet = (page_size = 200) =>
  axios
    .get<{ rows: any[] }>('/portioning-sheet', { params: { page_size } })
    .then((r) => r.data.rows);

export const getPortioningRows = (ing_uid: string) =>
  axios
    .get<{ rows: any[] }>('/portioning-rows', { params: { ing_uid } })
    .then((r) => r.data.rows);

export const portioningSave = (body: {
  source_ingredient: string;
  source_category?: string;
  source_variant?: string;
  source_subvariant?: string;
  source_form?: string;
  source_preparation?: string;
  source_unit?: string;
  source_origin_id?: string;
  source_total_quantity?: number;
  keep_inventory_qty?: number;
  rows: any[];
}) => axios.post('/portioning-save', body).then((r) => r.data);

export type PortioningLevelsResponse = {
  page: number;
  page_size: number;
  total_items: number;
  portions: any[];
};

export const getPortioningLevelsStock = (page = 1, page_size = 100) =>
  axios
    .get<PortioningLevelsResponse>('/portioning-levels-stock', { params: { page, page_size } })
    .then((r) => r.data);

export const getPortioningRestockItems = () =>
  axios.get<{ rows: any[] }>('/portioning-restock-items').then((r) => r.data.rows);

export const portioningRestockAdd = (Portion_UID: string, quantity: number) =>
  axios.post('/portioning-restock-add', { Portion_UID, quantity }).then((r) => r.data);

export const getEditPortioningRecords = () =>
  axios.get<{ records: any[] }>('/edit-portioning-records').then((r) => r.data.records);

export const editPortioningRecord = (id: number, quantity: number) =>
  axios.post('/edit-portioning-record', { id, quantity }).then((r) => r.data);

export const editPortioningRecordRemove = (id: number) =>
  axios.post('/edit-portioning-record-remove', { id }).then((r) => r.data);

// ── POS ──────────────────────────────────────────────────────────────────

export const posManual = (body: {
  unique_code: string;
  quantity?: number;
  date?: string;
  time?: string;
}) => axios.post('/pos-manual', body).then((r) => r.data);

export const resetPosOrders = () => axios.post('/reset-pos-orders').then((r) => r.data);

// ── Inventory / stock ────────────────────────────────────────────────────

export type LatestStockResponse = {
  date: string;
  page: number;
  page_size: number;
  total_items: number;
  ingredients: any[];
};

export const getLatestStock = (page = 1, page_size = 100) =>
  axios
    .get<LatestStockResponse>('/latest-stock', { params: { page, page_size } })
    .then((r) => r.data);

export const getAlterIngredientData = (page_size = 200) =>
  axios.get<{ rows: any[] }>('/alter-ingredient-data', { params: { page_size } }).then((r) => r.data.rows);

export const saveAlterIngredientData = (updates: any[]) =>
  axios.post('/alter-ingredient-data-save', { updates }).then((r) => r.data);

export const getAlterPortioningData = (page_size = 200) =>
  axios.get<{ rows: any[] }>('/alter-portioning-data', { params: { page_size } }).then((r) => r.data.rows);

export const saveAlterPortioningData = (updates: any[]) =>
  axios.post('/alter-portioning-data-save', { updates }).then((r) => r.data);

// ── Usage & profitability ────────────────────────────────────────────────

export type ProfitabilityRow = {
  menu_category: string;
  menu_item: string;
  menu_price: number;
  cost: number;
  margin: number;
  margin_percent: number;
  [k: string]: any;
};

export const getProfitability = (page_size = 500) =>
  axios
    .get<{ items: ProfitabilityRow[] }>('/profitability', { params: { page_size } })
    .then((r) => r.data.items);

export type MonthlyUsageRow = {
  ingredient: string;
  category: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  origin_id: string;
  unit: string;
  total_monthly_usage: number;
  total_usage_cost: number;
  total_monthly_wastage: number;
  total_monthly_wastage_cost: number;
};

export type MonthlyUsageResponse = {
  usage: MonthlyUsageRow[];
  window_start: string;
  window_end: string;
};

export const getMonthlyUsage = (date_from?: string, date_to?: string) =>
  axios
    .get<MonthlyUsageResponse>('/monthly-usage', { params: { date_from, date_to } })
    .then((r) => r.data);

// ── Restocks edit / todo ─────────────────────────────────────────────────

export type TodoRestock = [number, string, string, number, string]; // [id, date, ingredient, qty, unit]

export const getTodoRestocks = () =>
  axios.get<{ todo: TodoRestock[] }>('/todo-restocks').then((r) => r.data.todo);

export const updateRestockCost = (id: number, total_cost: number) =>
  axios.post('/update-restock-cost', { id, total_cost }).then((r) => r.data);

export type EditRestockRow = {
  id: number;
  date: string;
  ingredient: string;
  unit: string;
  quantity: number;
  total_cost: number;
  pending_remove: boolean;
  undo_id: number | null;
  undo_expires_at: string | null;
};

export const getEditRestocks = (opts?: {
  days?: number;
  date_from?: string;
  date_to?: string;
}) =>
  axios
    .get<{
      days: number;
      start_date: string;
      end_date: string;
      restocks: EditRestockRow[];
    }>('/edit-restocks', { params: opts })
    .then((r) => r.data);

export const editRestock = (id: number, quantity: number, total_cost?: number | null) =>
  axios.post('/edit-restock', { id, quantity, total_cost }).then((r) => r.data);

export const editRestockRemoveItem = (id: number) =>
  axios.post('/edit-restock-remove-item', { id }).then((r) => r.data);

export const editRestockUndoRemoveItem = (undo_id: number) =>
  axios.post('/edit-restock-undo-remove-item', { undo_id }).then((r) => r.data);

// ── Uploaded files management ────────────────────────────────────────────

export type UploadedFile = {
  id: number;
  date: string;
  file_name: string;
  file_type: string;
  rows: number;
  [k: string]: any;
};

export const getEditUploadFiles = (days = 30) =>
  axios
    .get<{ days: number; start_date: string; end_date: string; files: UploadedFile[] }>(
      '/edit-upload-files',
      { params: { days } }
    )
    .then((r) => r.data);

export const deleteUploadFile = (id: number) =>
  axios.post('/delete-upload-file', { id }).then((r) => r.data);

// ── System / operations ──────────────────────────────────────────────────

export type BackendSummary = {
  generated_at: string;
  restock_mode: string;
  counts: { [k: string]: number };
  [k: string]: any;
};

export const getBackendSummary = () =>
  axios.get<BackendSummary>('/backend-summary').then((r) => r.data);

export type BackendTrendPoint = {
  date: string;
  pos_orders: number;
  restocks: number;
  restocked_qty?: number;
  [k: string]: any;
};

export const getBackendTrends = (days = 14) =>
  axios
    .get<{ days: number; series: BackendTrendPoint[] }>('/backend-trends', { params: { days } })
    .then((r) => r.data);

export const resetRestocks = () => axios.post('/reset-restocks').then((r) => r.data);

export const recompute = () => axios.post('/recompute').then((r) => r.data);
