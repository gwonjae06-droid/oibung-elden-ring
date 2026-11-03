import {createBattleCleanup} from './battle-cleanup.mjs';

// Register resources immediately after acquisition; transfer ownership only after setup succeeds.
export function createBattleStartup() {
  let state='pending';
  const steps=[];
  const cleanup=createBattleCleanup(()=>steps.slice().reverse());
  return {
    get pending(){return state==='pending';},
    resource(label,value){if(state!=='pending')throw Error('Battle startup is already settled');steps.push([label,()=>value.dispose()]);return value;},
    own(label,release){if(state!=='pending')throw Error('Battle startup is already settled');const entry=[label,release];steps.push(entry);return ()=>{const index=steps.indexOf(entry);if(index>=0)steps.splice(index,1);};},
    commit(){if(state!=='pending')throw Error('Battle startup is already settled');state='committed';steps.length=0;},
    rollback(){if(state==='committed')return Promise.resolve({errors:[],timeouts:[]});state='failed';return cleanup();}
  };
}

export function runBattleStartup(setup) {
  const startup=createBattleStartup();
  try {
    const view=setup(startup);
    startup.commit();
    return view;
  } catch(error) {
    startup.rollback().then(report=>{
      if(report.errors.length||report.timeouts.length)console.warn('Battle startup cleanup incomplete',report);
    });
    throw error;
  }
}
