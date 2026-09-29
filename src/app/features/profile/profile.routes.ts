import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':username',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('./components/profile-articles.component'),
          },
          {
            path: 'favorites',
            loadComponent: () => import('./components/profile-favorites.component'),
          },
        ],
      },
    ],
  },
];

export default routes;
