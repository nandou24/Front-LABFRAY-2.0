import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  IGetLastItemsLab,
  IItemLab,
  IItemLabPostDTO,
} from '../../../models/Mantenimiento/items.models';
import { environment } from '../../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class ItemLabService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/itemLab`;

  public registrarItemLab(body: IItemLab): Observable<IItemLabPostDTO> {
    console.log('Enviando valores desde servicio');
    console.log(body);

    return this._http.post<IItemLabPostDTO>(`${this.apiUrl}/newItemLab`, body);
  }

  getLastItemsLab(): Observable<IItemLab[]> {
    return this._http.get<IGetLastItemsLab>(`${this.apiUrl}/lastItems`).pipe(
      map((data) => {
        return data.itemsLab;
      }),
    );
  }

  getItem(terminoBusqueda: any): Observable<IItemLab[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastItemsLab>(`${this.apiUrl}/findTerm`, {
        params,
      })
      .pipe(map((data) => data.itemsLab));
  }

  public actualizarItem(
    codigo: string,
    body: IItemLab,
  ): Observable<IItemLabPostDTO> {
    return this._http.put<IItemLabPostDTO>(
      `${this.apiUrl}/${codigo}/updateItem`,
      body,
    );
  }
}
