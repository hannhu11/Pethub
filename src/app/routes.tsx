import { createBrowserRouter } from 'react-router';
import { CustomerLayout } from './components/layout';
import { HomePage } from './components/home';
import { LoginPage, RegisterPage } from './components/auth';
import { ServicesPage } from './components/services';
import { ProfilePage, PetListPage, BookingListPage, DigitalCardPage } from './components/customer-dashboard';
import { ManagerLayout } from './components/manager-layout';
import { ManagerDashboardPage } from './components/manager-dashboard';
import { ManagerBookingsPage } from './components/manager-bookings';
import {
  ManagerCatalogPage,
  ManagerPetsPage, ManagerCustomersPage
} from './components/manager-services';
import { ManagerRemindersPage } from './components/manager-reminders';
import { ManagerSettingsPage } from './components/manager-settings';
import { ManagerPOSPage } from './components/manager-pos';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: CustomerLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'services', Component: ServicesPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'my-pets', Component: PetListPage },
      { path: 'my-bookings', Component: BookingListPage },
      { path: 'digital-card/:petId', Component: DigitalCardPage },
    ],
  },
  {
    path: '/manager',
    Component: ManagerLayout,
    children: [
      { index: true, Component: ManagerDashboardPage },
      { path: 'pos', Component: ManagerPOSPage },
      { path: 'bookings', Component: ManagerBookingsPage },
      { path: 'customers', Component: ManagerCustomersPage },
      { path: 'pets', Component: ManagerPetsPage },
      { path: 'catalog', Component: ManagerCatalogPage },
      { path: 'reminders', Component: ManagerRemindersPage },
      { path: 'settings', Component: ManagerSettingsPage },
    ],
  },
]);
