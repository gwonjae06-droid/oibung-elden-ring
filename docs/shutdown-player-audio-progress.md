# Player audio shutdown: WIP branch only

The preceding boss-audio disposal implementation was committed as e46b4183f77fb5394d3ceb28dd801215882e0df1. This step changes player-sound.mjs and adds seven lifecycle tests. It must not be treated as complete game shutdown or merged into main alone.

Player audio no longer uses module-global context, bus, noise or listening state. Each instance owns its fallback context, node graph and gesture listener registrations. Muted or hidden gestures do not unlock or create audio. dispose() synchronously marks the instance terminal, removes gesture listeners, stops/disconnects active sources and disconnects its infrastructure. Repeated calls share a completion Promise that reports cleanup/close errors instead of rejecting. Retained gesture callbacks and play() cannot recreate disposed audio. clear() remains reusable before disposal. Partial voice creation failures release the nodes already created. The existing sound recipe module is unchanged.

Optional getContext is borrowed and never closed here. getDestination permits routing this backend to a session-owned output bus; listenForGestures:false permits the future app service to own gesture unlocking. These are injection points, not an implemented shared app audio service. Default instances still own separate fallback contexts. The completion Promise currently has no timeout if a native close never settles.

Validation: seven targeted Node tests passed against the revised source with the repository player-presentation recipes and sound-variation dependency, using injected window/audio doubles. No live browser audio, full npm test or leak measurement was performed.

Still required: player-polish must expose a terminal disposal path that invokes sound.dispose(), and skill-fx/main/secondary session owners must invoke their child disposers. Implement the common audio service and session-scope deadline, inject the appropriate context/output/unlock policy at every factory, and execute the full acceptance matrix. Current game callers are not changed by this patch and are not yet guaranteed to invoke player audio disposal.
