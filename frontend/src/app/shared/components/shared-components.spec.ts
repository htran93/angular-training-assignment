import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AppShellComponent } from './app-shell/app-shell.component';
import { FormFieldComponent } from './form-field/form-field.component';
import { JarCardComponent } from './jar-card/jar-card.component';
import { MetricCardComponent } from './metric-card/metric-card.component';
import { MonthSelectorComponent } from './month-selector/month-selector.component';
import { PanelComponent } from './panel/panel.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { StatePanelComponent } from './state-panel/state-panel.component';
import { VndAmountInputComponent } from './vnd-amount-input/vnd-amount-input.component';
import { VndAmountPipe } from '../pipes/vnd-amount.pipe';

@Component({
  selector: 'test-vnd-amount-input-host',
  standalone: true,
  imports: [ReactiveFormsModule, VndAmountInputComponent],
  template: '<app-vnd-amount-input id="amount" [formControl]="amount" />'
})
class VndAmountInputHostComponent {
  readonly amount = new FormControl('1250', { nonNullable: true });
}

describe('shared components', () => {
  it('renders the app shell navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.ff-navigation__item')) as HTMLAnchorElement[];
    expect(links.map(link => link.textContent?.trim())).toEqual(['Home', 'Planning', 'Add Expense']);
    expect(fixture.nativeElement.querySelector('#ff-main-content')).not.toBeNull();
  });

  it('emits the selected period from the month selector', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('options', [{ value: '2026-09', label: 'September 2026' }]);
    fixture.detectChanges();

    let selected: string | null = null;
    fixture.componentInstance.valueChange.subscribe(value => selected = value);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '2026-09';
    select.dispatchEvent(new Event('change'));

    expect(selected).toBe('2026-09');
  });

  it('exposes month selector accessibility attributes and disabled state', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('label', 'Plan month');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('describedBy', 'month-help month-error');
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.getAttribute('aria-label')).toBe('Plan month');
    expect(select.getAttribute('aria-describedby')).toBe('month-help month-error');
    expect(select.required).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('renders a titled panel as a named region', async () => {
    await TestBed.configureTestingModule({ imports: [PanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(PanelComponent);
    fixture.componentRef.setInput('title', 'Plan details');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="region"]').getAttribute('aria-label')).toBe('Plan details');
  });

  it('renders the jar identity and formats the supplied VND amount', async () => {
    await TestBed.configureTestingModule({ imports: [JarCardComponent] }).compileComponents();

    const fixture = TestBed.createComponent(JarCardComponent);
    fixture.componentRef.setInput('jarType', 'food');
    fixture.componentRef.setInput('name', 'Food');
    fixture.componentRef.setInput('percentage', 20);
    fixture.componentRef.setInput('amountVnd', '1250000');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ff-jar-card--food')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Food');
    expect(fixture.nativeElement.textContent).toContain('20%');
    expect(fixture.nativeElement.textContent).toContain('1,250,000 VND');
  });

  it('renders a metric label and value', async () => {
    await TestBed.configureTestingModule({ imports: [MetricCardComponent] }).compileComponents();

    const fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('label', 'Monthly income');
    fixture.componentRef.setInput('value', '25,000,000 VND');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Monthly income');
    expect(fixture.nativeElement.textContent).toContain('25,000,000 VND');
  });

  it('caps only the progress visualization and accessible numeric value', async () => {
    await TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).compileComponents();

    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('label', 'Food spending');
    fixture.componentRef.setInput('value', 125);
    fixture.componentRef.setInput('valueText', '125% - over budget');
    fixture.componentRef.setInput('overBudget', true);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = fixture.nativeElement.querySelector('.ff-progress__fill') as HTMLElement;
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
    expect(progress.getAttribute('aria-valuetext')).toBe('125% - over budget');
    expect(fill.style.width).toBe('100%');
    expect(fixture.nativeElement.textContent).toContain('125% - over budget');
  });

  it('uses the supplied progress maximum without changing the displayed value', async () => {
    await TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).compileComponents();

    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('label', 'Annual budget');
    fixture.componentRef.setInput('value', 150);
    fixture.componentRef.setInput('max', 200);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = fixture.nativeElement.querySelector('.ff-progress__fill') as HTMLElement;
    expect(progress.getAttribute('aria-valuemax')).toBe('200');
    expect(progress.getAttribute('aria-valuenow')).toBe('150');
    expect(progress.getAttribute('aria-valuetext')).toBe('150%');
    expect(fill.style.width).toBe('75%');
  });

  it('associates form-field labels and messages with the control id', async () => {
    await TestBed.configureTestingModule({ imports: [FormFieldComponent] }).compileComponents();

    const fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('controlId', 'income');
    fixture.componentRef.setInput('label', 'Monthly income');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('helpText', 'Enter a positive amount.');
    fixture.componentRef.setInput('errorMessage', 'Income is required.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label').getAttribute('for')).toBe('income');
    expect(fixture.componentInstance.describedBy).toBe('income-help income-error');
    expect(fixture.nativeElement.querySelector('#income-help').textContent).toContain('Enter a positive amount.');
    expect(fixture.nativeElement.querySelector('#income-error')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('(required)');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Income is required.');
  });

  it('passes raw VND input strings to Angular forms without coercion', async () => {
    await TestBed.configureTestingModule({ imports: [VndAmountInputComponent] }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputComponent);
    fixture.componentRef.setInput('id', 'income');
    fixture.detectChanges();

    let changedValue = '';
    fixture.componentInstance.registerOnChange((value: string) => changedValue = value);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '0012500';
    input.dispatchEvent(new Event('input'));

    expect(changedValue).toBe('0012500');
    expect(fixture.componentInstance.value).toBe('0012500');
  });

  it('integrates the VND input with Angular forms value, touched, and disabled states', async () => {
    await TestBed.configureTestingModule({ imports: [VndAmountInputHostComponent] }).compileComponents();

    const fixture = TestBed.createComponent(VndAmountInputHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('1250');

    fixture.componentInstance.amount.setValue('2500');
    fixture.detectChanges();
    expect(input.value).toBe('2500');

    input.value = '3750';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.amount.value).toBe('3750');

    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.amount.touched).toBe(true);

    fixture.componentInstance.amount.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('uses alert semantics for errors and status semantics for other states', async () => {
    await TestBed.configureTestingModule({ imports: [StatePanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('title', 'Unable to load plan');
    fixture.componentRef.setInput('message', 'Try again.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.componentInstance.liveMode).toBe('assertive');
  });

  it('uses polite status semantics for non-error states', async () => {
    await TestBed.configureTestingModule({ imports: [StatePanelComponent] }).compileComponents();

    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('title', 'Monthly plan unavailable');
    fixture.componentRef.setInput('message', 'Create a plan to continue.');

    for (const variant of ['empty', 'loading', 'unavailable'] as const) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();

      const state = fixture.nativeElement.querySelector('section');
      expect(state.getAttribute('role')).toBe('status');
      expect(state.getAttribute('aria-live')).toBe('polite');
    }
  });

  it('formats whole VND strings without converting them to JavaScript numbers', () => {
    const pipe = new VndAmountPipe();

    expect(pipe.transform('12345678901234567890')).toBe('12,345,678,901,234,567,890 VND');
    expect(pipe.transform('-1250000')).toBe('-1,250,000 VND');
    expect(pipe.transform('0000')).toBe('0 VND');
    expect(pipe.transform('not-money')).toBe('not-money');
    expect(pipe.transform(null)).toBe('');
  });
});
