import { Ref } from "../v7(v3.0.0-alpha.1)/ref";

export function isRef<T>(r: Ref<T> | T): r is Ref<T>;
export function isRef(r: any): r is Ref {
  return r ? r._isRef === true : false;
}

export {
  UnwrapRef,
  Ref,
  ref,
  toRefs,
} from "../v7(v3.0.0-alpha.1)/ref";
