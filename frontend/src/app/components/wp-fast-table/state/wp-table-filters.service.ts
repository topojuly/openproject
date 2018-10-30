// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {WorkPackageQueryStateService} from './wp-table-base.service';
import {Injectable} from '@angular/core';
import {QueryResource} from 'core-app/modules/hal/resources/query-resource';
import {QuerySchemaResource} from 'core-app/modules/hal/resources/query-schema-resource';
import {QueryFilterInstanceResource} from 'core-app/modules/hal/resources/query-filter-instance-resource';
import {CollectionResource} from 'core-app/modules/hal/resources/collection-resource';
import {WorkPackageTableFilters} from '../wp-table-filters';
import {IsolatedQuerySpace} from "core-app/modules/work_packages/query-space/isolated-query-space";
import {InputState} from 'reactivestates';
import {cloneHalResourceCollection} from 'core-app/modules/hal/helpers/hal-resource-builder';
import {QueryFilterResource} from "core-app/modules/hal/resources/query-filter-resource";
import {QueryFilterInstanceSchemaResource} from "core-app/modules/hal/resources/query-filter-instance-schema-resource";
import {States} from "core-components/states.service";
import {HalResource} from 'core-app/modules/hal/resources/hal-resource';

@Injectable()
export class WorkPackageTableFiltersService extends WorkPackageQueryStateService<QueryFilterInstanceResource[]> {

  constructor(protected readonly states:States,
              protected readonly querySpace:IsolatedQuerySpace) {
    super(querySpace);
  }

  protected get inputState():InputState<QueryFilterInstanceResource[]> {
    return this.querySpace.filters;
  }

  public get availableState():InputState<QueryFilterInstanceSchemaResource[]> {
    return this.states.query.available.filters;
  }

  protected get availableSchemas():QueryFilterInstanceSchemaResource[] {
    return this.availableState.getValueOr([]);
  }

  /**
   * Add a filter instantiation from the set of available filter schemas
   *
   * @param filter
   */
  public add(filter:QueryFilterResource) {
    let schema = _.find(this.availableSchemas, schema => (schema.filter.allowedValues as HalResource)[0].href === filter.href)!;
    let newFilter = schema.getFilter();

    this.inputState.doModify(filters => filters.concat([newFilter]));

    return newFilter;
  }

  public remove(filter:QueryFilterInstanceResource) {
    let index = this.current.indexOf(filter);
    this.inputState.doModify(filters => filters.splice(index, 1));
  }

  public initializeFilters(query:QueryResource, schema:QuerySchemaResource) {
    let filters = _.map(query.filters, filter => filter.$copy<QueryFilterInstanceResource>());

    this.loadCurrentFiltersSchemas(filters).then(() => {
      let newState = new WorkPackageTableFilters(filters, schema.filtersSchemas.elements);

      this.update(newState);
    });
  }

  public hasChanged(query:QueryResource) {
    const comparer = (filter:QueryFilterInstanceResource[]) => filter.map(el => el.$source);

    return !_.isEqual(
      comparer(query.filters),
      comparer(this.current)
    );
  }

  public find(id:string):QueryFilterInstanceResource|undefined {
    return _.find(this.currentState.current, filter => filter.id === id);
  }

  public valueFromQuery(query:QueryResource) {
    return undefined;
  }

  public applyToQuery(query:QueryResource) {
    query.filters = this.current;
    return true;
  }

  public get current():QueryFilterInstanceResource[] {
    return this.state.getValueOr([]);
  }

  public replace(newState:QueryFilterInstanceResource[]) {
    this.state.putValue(newState);
  }

  public replaceIfComplete(newState:QueryFilterInstanceResource[]) {
    if (this.isComplete(newState)) {
      this.state.putValue(newState);
    }
  }

  public get remainingFilters() {
    var activeFilterHrefs = this.currentFilters.map(filter => filter.href);

    return _.remove(this.availableFilters, filter => activeFilterHrefs.indexOf(filter.href) === -1);
  }

  public isComplete(filters:QueryFilterInstanceResource[]):boolean {
    return _.every(filters, filter => filter.isCompletelyDefined());
  }

  private get currentFilters() {
    return this.current.map((filter:QueryFilterInstanceResource) => filter.filter);
  }

  private get availableFilters() {
    let availableFilters = this.availableSchemas
                               .map(schema => (schema.filter.allowedValues as QueryFilterResource[])[0]);

    // We do not use the filters id and parent as of now as we do not have adequate
    // means to select the values.
    return _.filter(availableFilters, filter => filter.id !== 'id' && filter.id !== 'parent');
  }

  private loadCurrentFiltersSchemas(filters:QueryFilterInstanceResource[]):Promise<{}> {
    return Promise.all(filters.map((filter:QueryFilterInstanceResource) => filter.schema.$load()));
  }
}
