import { createBrowserRouter, Navigate } from 'react-router';
import { PublicLayout, CustomerLayout } from './components/layout';
import { HomePage } from './components/home';
import { LoginPage, RegisterPage } from './components/auth';
import { ServicesPage } from './components/services';
import { ProfilePage, PetListPage, DigitalCardPage } from './components/customer-dashboard';
import { ManagerLayout } from './components/manager-layout';
import { ManagerDashboardPage } from './components/manager-dashboard';
import { ManagerBookingsPage } from './components/manager-bookings';
import { ManagerCatalogPage } from './components/manager-services';
import { ManagerPetsPage, ManagerCustomersPage } from './components/manager-crm';
import { ManagerRemindersPage } from './components/manager-reminders';
import { ManagerReminderTemplatesPage } from './components/manager-reminder-templates';
import { ManagerSettingsPage } from './components/manager-settings';
import { ManagerUpgradePremiumPage } from './components/manager-upgrade-premium';
import { ManagerPOSPage } from './components/manager-pos';
import { ManagerPosTransactionStatusPage } from './components/manager-pos-transaction';
import { ManagerInvoicePage } from './components/manager-invoice';
import { ManagerNotificationsPage } from './components/manager-notifications';
import { RequireCustomerGuard, RequireManagerGuard, useAuthSession } from './auth-session';
import {
  PricingPage,
  AboutPage,
  BlogPage,
  ContactPage,
  HelpPage,
  TermsPage,
  PrivacyPage,
} from './components/public-pages';
import { CustomerAppointmentsPage } from './components/customer-appointments';
import { CustomerOverviewPage } from './components/customer-overview';
import type { RouteAccess } from './types';

function RedirectToCustomerDashboard() {
  return <Navigate to='/customer/dashboard' replace />;
}

function RedirectToHome() {
  return <Navigate to='/' replace />;
}

function getAuthenticatedDefaultPath(role: 'customer' | 'manager' | null) {
  return role === 'manager' ? '/manager' : '/customer/dashboard';
}

function GuestLoginPage() {
  const { session } = useAuthSession();
  if (session.isAuthenticated) {
    if (session.onboarding?.required && session.onboarding.nextStep) {
      return <Navigate to={session.onboarding.nextStep} replace />;
    }
    return <Navigate to={getAuthenticatedDefaultPath(session.role)} replace />;
  }
  return <LoginPage />;
}

function GuestRegisterPage() {
  const { session } = useAuthSession();
  if (session.isAuthenticated) {
    if (session.onboarding?.required && session.onboarding.nextStep) {
      return <Navigate to={session.onboarding.nextStep} replace />;
    }
    return <Navigate to={getAuthenticatedDefaultPath(session.role)} replace />;
  }
  return <RegisterPage />;
}

const access = {
  public: 'public',
  customer: 'customer',
  manager: 'manager',
} as const satisfies Record<RouteAccess, RouteAccess>;

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PublicLayout,
    handle: { access: access.public },
    children: [
      { index: true, Component: HomePage, handle: { access: access.public } },
      { path: 'pricing', Component: PricingPage, handle: { access: access.public } },
      { path: 'about', Component: AboutPage, handle: { access: access.public } },
      { path: 'blog', Component: BlogPage, handle: { access: access.public } },
      { path: 'contact', Component: ContactPage, handle: { access: access.public } },
      { path: 'help', Component: HelpPage, handle: { access: access.public } },
      { path: 'terms', Component: TermsPage, handle: { access: access.public } },
      { path: 'privacy', Component: PrivacyPage, handle: { access: access.public } },
      { path: 'login', Component: GuestLoginPage, handle: { access: access.public } },
      { path: 'register', Component: GuestRegisterPage, handle: { access: access.public } },
    ],
  },
  {
    Component: RequireCustomerGuard,
    children: [
      {
        path: '/customer',
        Component: CustomerLayout,
        handle: { access: access.customer },
        children: [
          { index: true, Component: RedirectToCustomerDashboard, handle: { access: access.customer } },
          { path: 'dashboard', Component: CustomerOverviewPage, handle: { access: access.customer } },
          { path: 'services', Component: ServicesPage, handle: { access: access.customer } },
          { path: 'profile', Component: ProfilePage, handle: { access: access.customer } },
          { path: 'my-pets', Component: PetListPage, handle: { access: access.customer } },
          { path: 'appointments', Component: CustomerAppointmentsPage, handle: { access: access.customer } },
          { path: 'digital-card/:petId', Component: DigitalCardPage, handle: { access: access.customer } },
        ],
      },
    ],
  },
  {
    Component: RequireManagerGuard,
    children: [
      {
        path: '/manager',
        Component: ManagerLayout,
        handle: { access: access.manager },
        children: [
          { index: true, Component: ManagerDashboardPage, handle: { access: access.manager } },
          { path: 'pos', Component: ManagerPOSPage, handle: { access: access.manager } },
          { path: 'pos/transaction/:invoiceId', Component: ManagerPosTransactionStatusPage, handle: { access: access.manager } },
          { path: 'pos/receipt/:invoiceId', Component: ManagerInvoicePage, handle: { access: access.manager } },
          { path: 'bookings', Component: ManagerBookingsPage, handle: { access: access.manager } },
          { path: 'customers', Component: ManagerCustomersPage, handle: { access: access.manager } },
          { path: 'pets', Component: ManagerPetsPage, handle: { access: access.manager } },
          { path: 'catalog', Component: ManagerCatalogPage, handle: { access: access.manager } },
          { path: 'reminders', Component: ManagerRemindersPage, handle: { access: access.manager } },
          { path: 'reminders/templates', Component: ManagerReminderTemplatesPage, handle: { access: access.manager } },
          { path: 'notifications', Component: ManagerNotificationsPage, handle: { access: access.manager } },
          { path: 'settings/upgrade-premium', Component: ManagerUpgradePremiumPage, handle: { access: access.manager } },
          { path: 'settings', Component: ManagerSettingsPage, handle: { access: access.manager } },
          { path: 'invoice/:invoiceId', Component: ManagerInvoicePage, handle: { access: access.manager } },
        ],
      },
    ],
  },
  {
    path: '*',
    Component: RedirectToHome,
  },
]);
