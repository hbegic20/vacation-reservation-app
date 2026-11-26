import { UserRole } from '@vacation/shared';
import { IconName } from '@/components/ui/icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  shortLabel?: string;
  waitingCount?: number;
}

const employeeNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/vacations', label: 'My requests', icon: 'list' },
  { href: '/vacations/request', label: 'New request', icon: 'plusCircle' },
  { href: '/team', label: 'Team', icon: 'users' },
  { href: '/documents', label: 'Documents', shortLabel: 'Docs', icon: 'file' }
];

const adminNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/admin/requests', label: 'Approvals', icon: 'inbox' },
  { href: '/admin/employees', label: 'Employees', icon: 'users' },
  { href: '/admin/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/admin/documents', label: 'Documents', shortLabel: 'Docs', icon: 'file' },
  { href: '/admin/admins', label: 'Admins', icon: 'shield' }
];

const approvalsHref = '/admin/requests';

export function navItemsFor(role: UserRole, pendingApprovals: number): NavItem[] {
  if (role !== 'ADMIN') {
    return employeeNavItems;
  }
  return adminNavItems.map((item) =>
    item.href === approvalsHref ? { ...item, waitingCount: pendingApprovals } : item
  );
}
