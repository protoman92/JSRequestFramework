import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

export type ResultProcessor<Res1,Res2> = (r: Res1) => Observable<Try<Res2>>;