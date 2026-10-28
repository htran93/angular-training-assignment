import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndAmount',
  standalone: true,
  pure: true
})
export class VndAmountPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value === null || value === undefined || !/^-?\d+$/.test(value)) {
      return value ?? '';
    }

    const negative = value.startsWith('-');
    const digits = (negative ? value.slice(1) : value).replace(/^0+(?=\d)/, '');
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `${negative ? '-' : ''}${grouped} VND`;
  }
}
