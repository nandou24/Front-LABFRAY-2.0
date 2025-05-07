import { MatPaginatorIntl } from '@angular/material/paginator';

export function customPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Mostrar';
  return intl;
}
