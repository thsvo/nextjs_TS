// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// components
import SvgColor from '../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  blog: icon('ic_blog'),
  cart: icon('ic_cart'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

const navConfig = [
  {
    subheader: 'Pantrix',
    items: [
      { title: 'Backend Dashboard', path: PATH_DASHBOARD.pantrix.dashboard, icon: ICONS.dashboard },
      { title: 'Inventory Levels', path: PATH_DASHBOARD.pantrix.inventory.levels, icon: ICONS.ecommerce },
      { title: 'Inventory Usage', path: PATH_DASHBOARD.pantrix.inventory.usage, icon: ICONS.analytics },
      { title: 'Profitability', path: PATH_DASHBOARD.pantrix.profitability, icon: ICONS.analytics },
      { title: 'Stock Take', path: PATH_DASHBOARD.pantrix.inventory.stockTake, icon: ICONS.file },
    ],
  },
  {
    subheader: 'Menu & Recipes',
    items: [{ title: 'Menu Mapping', path: PATH_DASHBOARD.pantrix.menu.mapping, icon: ICONS.menuItem }],
  },
  {
    subheader: 'Restock',
    items: [
      { title: 'Restock Sheet', path: PATH_DASHBOARD.pantrix.restock.list, icon: ICONS.cart },
      { title: 'Manual Add', path: PATH_DASHBOARD.pantrix.restock.manualAdd, icon: ICONS.cart },
      { title: 'To Do List', path: PATH_DASHBOARD.pantrix.restock.todo, icon: ICONS.file },
      { title: 'Edit Restocks', path: PATH_DASHBOARD.pantrix.restock.edit, icon: ICONS.file },
    ],
  },
  {
    subheader: 'Portioning',
    items: [
      { title: 'Portioning Sheet', path: PATH_DASHBOARD.pantrix.portioning.sheet, icon: ICONS.folder },
      { title: 'Portion Levels', path: PATH_DASHBOARD.pantrix.portioning.levels, icon: ICONS.ecommerce },
      { title: 'Portion Restock', path: PATH_DASHBOARD.pantrix.portioning.restock, icon: ICONS.cart },
      { title: 'Portion Records', path: PATH_DASHBOARD.pantrix.portioning.records, icon: ICONS.file },
    ],
  },
  {
    subheader: 'Ingredients',
    items: [
      { title: 'Add Ingredient', path: PATH_DASHBOARD.pantrix.ingredients.add, icon: ICONS.label },
      { title: 'Alter Ingredient Data', path: PATH_DASHBOARD.pantrix.ingredients.alter, icon: ICONS.label },
      {
        title: 'Alter Portioning Data',
        path: PATH_DASHBOARD.pantrix.ingredients.alterPortioning,
        icon: ICONS.label,
      },
    ],
  },
  {
    subheader: 'POS',
    items: [{ title: 'Manual Order Entry', path: PATH_DASHBOARD.pantrix.pos.manual, icon: ICONS.invoice }],
  },
  {
    subheader: 'Data',
    items: [
      { title: 'Upload Data', path: PATH_DASHBOARD.pantrix.data.upload, icon: ICONS.file },
      { title: 'Upload Backend', path: PATH_DASHBOARD.pantrix.data.uploadBackend, icon: ICONS.file },
      { title: 'Edit Data', path: PATH_DASHBOARD.pantrix.data.edit, icon: ICONS.file },
    ],
  },
  {
    subheader: 'Admin',
    items: [
      { title: 'Restaurants', path: PATH_DASHBOARD.pantrix.admin.restaurants, icon: ICONS.banking },
      { title: 'Users', path: PATH_DASHBOARD.pantrix.admin.users, icon: ICONS.user },
      { title: 'Client Page Settings', path: PATH_DASHBOARD.pantrix.admin.pageSettings, icon: ICONS.lock },
      { title: 'System', path: PATH_DASHBOARD.pantrix.system, icon: ICONS.disabled },
    ],
  },
];

export default navConfig;
