import { VacationRequest } from '@vacation/shared';

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function requesterName(request: VacationRequest): string {
  return request.user ? fullName(request.user) : 'Unknown employee';
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
