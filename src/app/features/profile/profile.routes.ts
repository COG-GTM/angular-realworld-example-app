import { Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile/profile.component';
import { readingListGuard } from './reading-list.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':username',
        component: ProfileComponent,
        children: [
          {
            path: '',
            loadComponent: () => import('./components/profile-articles.component'),
          },
          {
            path: 'favorites',
            loadComponent: () => import('./components/profile-favorites.component'),
          },
          {
            path: 'reading-list',
            loadComponent: () => import('./components/profile-reading-list.component'),
            canActivate: [readingListGuard],
            runGuardsAndResolvers: 'always',
          },
        ],
      },
    ],
  },
];

export default routes;
