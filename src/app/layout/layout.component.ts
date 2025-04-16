import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { RouterModule } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    SidenavComponent,
    MatSidenavModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

  edgeHoverZone = 15; // px desde el borde izquierdo

  checkEdgeHover(event: MouseEvent, drawer: MatDrawer) {
    if (event.clientX < this.edgeHoverZone && !drawer.opened) {
      drawer.open();
    }
  }

  openDrawer(drawer: MatDrawer) {
    drawer.open();
  }

  closeDrawer(drawer: MatDrawer) {
    drawer.close();
  }  


}
