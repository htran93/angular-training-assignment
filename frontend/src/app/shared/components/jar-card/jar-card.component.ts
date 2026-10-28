import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { JarType } from '../../models/jar-type';
import { VndAmountPipe } from '../../pipes/vnd-amount.pipe';

@Component({
  selector: 'app-jar-card',
  standalone: true,
  imports: [VndAmountPipe],
  templateUrl: './jar-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JarCardComponent {
  @Input({ required: true }) jarType!: JarType;
  @Input({ required: true }) name!: string;
  @Input() percentage: number | null = null;
  @Input() amountVnd: string | null = null;
  @Input() amountLabel = 'Budget';
  @Input() description: string | null = null;
}
