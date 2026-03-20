import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { Provider } from '@angular/core';

export function provideLocationStrategy(): Provider {
  return { provide: LocationStrategy, useClass: HashLocationStrategy };
}
