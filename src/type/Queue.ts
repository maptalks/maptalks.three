import { ImageType } from "./BaseOption";

export type Queue = {
    key: string,
    url: string,
    callback: Function,
    img: ImageType,
    vt: any
};