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

import {QueryFilterResource} from 'core-app/modules/hal/resources/query-filter-resource';
import {QueryFilterInstanceResource} from 'core-app/modules/hal/resources/query-filter-instance-resource';
import {QueryFilterInstanceSchemaResource} from 'core-app/modules/hal/resources/query-filter-instance-schema-resource';
import {cloneHalResourceCollection} from 'core-app/modules/hal/helpers/hal-resource-builder';

export class WorkPackageTableFilters extends WorkPackageTableBaseState<QueryFilterInstanceResource[]> {

  public current:QueryFilterInstanceResource[] = [];
  public hidden:string[] = [
    'id',
    'parent',
    'datesInterval',
    'precedes',
    'follows',
    'relates',
    'duplicates',
    'duplicated',
    'blocks',
    'blocked',
    'partof',
    'includes',
    'requires',
    'required',
    'search',
    'subjectOrId'
  ];
export class WorkPackageTableFilters {
  public filters:QueryFilterInstanceResource[] = [];

  constructor(filters:QueryFilterInstanceResource[], public availableSchemas:QueryFilterInstanceSchemaResource[]) {
    this.filters = filters;
  }

  public $copy() {
    let filters = cloneHalResourceCollection<QueryFilterInstanceResource>(this.filters);
    let availableSchemas = cloneHalResourceCollection<QueryFilterInstanceSchemaResource>(this.availableSchemas);

    return new WorkPackageTableFilters(filters, availableSchemas);
  }


  public get remainingFilters() {
    let activeFilterHrefs = this.currentFilters.map(filter => filter.href);

    return _.remove(this.availableFilters, filter => activeFilterHrefs.indexOf(filter.href) === -1);
  }

  public get remainingVisibleFilters() {
    return this.remainingFilters
               .filter((filter) => this.hidden.indexOf(filter.id) === -1);
  }

  public isComplete():boolean {
    return _.every(this.current, filter => filter.isCompletelyDefined());
  }

  public get currentlyVisibleFilters() {
    const invisibleFilters = new Set(this.hidden);
    invisibleFilters.delete('search');

    return _.reject(this.currentFilters, (filter) => invisibleFilters.has(filter.id));
  }

  private get currentFilters() {
    return this.current.map((filter:QueryFilterInstanceResource) => filter.filter);
  }

  public get availableFilters() {
    return this.availableSchemas
      .map(schema => (schema.filter.allowedValues as QueryFilterResource[])[0]);
  }
}
