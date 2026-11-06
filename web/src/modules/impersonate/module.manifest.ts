import { defineModuleManifest } from '@/core/modules/types';
import UserRoundCog from 'lucide-react/dist/esm/icons/user-round-cog';
import { ImpersonatePage } from './pages/impersonate-page';

export default defineModuleManifest({
  alias: 'impersonate',
  pages: [{ path: '/admin/impersonate', component: ImpersonatePage, title: { namespace: 'module-impersonate', key: 'title' }, permission: 'impersonate:start' }],
  menu: [{ slug: 'impersonate', label: { namespace: 'module-impersonate', key: 'menu' }, href: '/admin/impersonate', position: 95, permission: 'impersonate:start', icon: UserRoundCog }],
});
