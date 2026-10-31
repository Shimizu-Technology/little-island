import {validHome} from '../home/model';
import type {Save} from './validation';
import type {StorageAdapter} from './storage';
import {preserveAndReplace} from './replacement';
/** Hydration publishes no writable state until the exact pre-repair bytes are safe. */
export async function preserveHomeMigration(adapter:StorageAdapter,encoded:string,before:Save,after:Save){
 try{assertMigratedHomes(after);}catch(error){await adapter.preserve(encoded);throw error;}
 const changed=homeChanged(before,after);
 if(!changed)return false;
 await preserveAndReplace(adapter,JSON.stringify(after),encoded);
 return true;
}

export function homeChanged(before:Save,after:Save){
 return Object.entries(before.personalization?.people??{}).some(([id,person])=>JSON.stringify(person.home)!==JSON.stringify(after.personalization?.people[id]?.home));
}
/** Restore retains the incoming pre-repair bytes AND the device's persisted/live originals. */
export async function preserveImportedHome(adapter:StorageAdapter,encoded:string,before:Save,after:Save,current:string|null){
 try{assertMigratedHomes(after);}catch(error){await adapter.preserve(encoded);throw error;}
 if(homeChanged(before,after))await adapter.preserve(encoded);
 await preserveAndReplace(adapter,JSON.stringify(after),current);
}

/** A migration is never a license to publish an unreadable active save. */
export function assertMigratedHomes(save:Save){
 for(const person of Object.values(save.personalization?.people??{}))if(person.home.version!==3||!validHome(person.home))throw new Error('This home could not be migrated. Your original has been kept.');
}
