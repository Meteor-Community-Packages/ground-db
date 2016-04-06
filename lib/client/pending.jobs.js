export class ReactiveNumber extends ReactiveVar {
  inc(by=1) {
    this.curValue += by;
    this.dep.changed();
  }
  dec(by=1) {
    this.inc(-by);
  }
}

/**
 * This class maintains a job counter, the total will
 * accumulate while increased and reset when pending hits 0
 * The api provides a `inc` and `dec` affecting the count.
 *
 * There are two reactive getters:
 * `progress` and `isDone`
 *
 */
export class ProgressCount {
  constructor() {
    this.count = new ReactiveNumber(0);
    this.total = new ReactiveNumber(0);
    this.percent = new ReactiveVar(0);
    this._depsDone = new Tracker.Dependency();
  }

  calcPercent() {
    return Math.min(Math.round((this.total.curValue !== 0)? (1 - (this.count.curValue / this.total.curValue)) * 100 : 100), 100);
  }

  inc(by=1) {
    this.count.inc(by);
    this.total.inc(by);

    if (this.count.curValue === by) {
      this._depsDone.changed();
    }

    this.percent.set(this.calcPercent());
  }

  dec(by=1) {
    this.count.dec(by);
    if (this.count.curValue === 0) {
      // Reset thte total when count is 0
      this.total.set(0);
      this.count.set(0);

      this._depsDone.changed();
    }
    this.percent.set(this.calcPercent());
  }

  progress() {
    return {
      index: this.count.get(),
      total: this.total.get(),
      percent: this.percent.get()
    };
  }

  isDone() {
    this._depsDone.depend();
    return this.count.curValue === 0;
  }
}
