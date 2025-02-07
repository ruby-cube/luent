export interface Particle {
	compounds: Link | undefined;
	compoundsTail: Link | undefined;
}

export interface Compound {
	flags: CompoundFlags;
	atoms: Link | undefined;
	particlesTail: Link | undefined;
}

export interface Link {
	particle: Particle | (Particle & Compound);
	compound: Compound | (Particle & Compound);
	// Reused to link the previous stack in updateDirtyFlag
	// Reused to link the previous stack in propagate
	prevCompound: Link | undefined;
	nextCompound: Link | undefined;
	// Reused to link the notify effect in queuedEffects
	nextParticle: Link | undefined;
}

export const enum CompoundFlags {
	Memoized = 1 << 0,
	Effect = 1 << 1,
	Tracking = 1 << 2,
	Notified = 1 << 3,
	Recursed = 1 << 4,
	Dirty = 1 << 5,
	PendingMemoized = 1 << 6,
	PendingEffect = 1 << 7,
	Propagated = Dirty | PendingMemoized | PendingEffect,
}

export function createReactiveSystem({
	updateMemoized,
	notifyEffect,
}: {
	/**
	 * Updates the memoized compound's value and returns whether it changed.
	 * 
	 * This function should be called when a memoized compound is marked as Dirty.
	 * The memoized compound's getter function is invoked, and its value is updated.
	 * If the value changes, the new value is stored, and the function returns `true`.
	 * 
	 * @param memoized - The memoized compound to update.
	 * @returns `true` if the memoized compound's value changed; otherwise `false`.
	 */
	updateMemoized(memoized: Particle & Compound): boolean;
	/**
	 * Handles effect notifications by processing the specified `effect`.
	 * 
	 * When an `effect` first receives any of the following flags:
	 *   - `Dirty`
	 *   - `PendingMemoized`
	 *   - `PendingEffect`
	 * this method will process them and return `true` if the flags are successfully handled.
	 * If not fully handled, future changes to these flags will trigger additional calls
	 * until the method eventually returns `true`.
	 */
	notifyEffect(effect: Compound): boolean;
}) {
	let queuedEffects: Compound | undefined;
	let queuedEffectsTail: Compound | undefined;

	return {
		/**
		 * Links a given particle and compound if they are not already linked.
		 * 
		 * @param particle - The particle to be linked.
		 * @param compound - The compound that depends on this particle.
		 * @returns The newly created link object if the two are not already linked; otherwise `undefined`.
		 */
		link(particle: Particle, compound: Compound): Link | undefined {
			const currentParticle = compound.particlesTail;
			if (
				currentParticle !== undefined
				&& currentParticle.particle === particle
			) {
				return;
			}
			const nextParticle = currentParticle !== undefined
				? currentParticle.nextParticle
				: compound.atoms;
			if (
				nextParticle !== undefined
				&& nextParticle.particle === particle
			) {
				compound.particlesTail = nextParticle;
				return;
			}
			const particleLastCompound = particle.compoundsTail;
			if (
				particleLastCompound !== undefined
				&& particleLastCompound.compound === compound
				&& isValidLink(particleLastCompound, compound)
			) {
				return;
			}
			return linkNewParticle(particle, compound, nextParticle, currentParticle);
		},
		/**
		 * Traverses and marks subscribers starting from the provided link.
		 * 
		 * It sets flags (e.g., Dirty, PendingMemoized, PendingEffect) on each compound
		 * to indicate which ones require re-computation or effect processing. 
		 * This function should be called after a signal's value changes.
		 * 
		 * @param link - The starting link from which propagation begins.
		 */
		propagate(link: Link): void {
			let targetFlag = CompoundFlags.Dirty;
			let compounds = link;
			let stack = 0;

			top: do {
				const compound = link.compound;
				const subFlags = compound.flags;

				if (
					(
						!(subFlags & (CompoundFlags.Tracking | CompoundFlags.Recursed | CompoundFlags.Propagated))
						&& (compound.flags = subFlags | targetFlag | CompoundFlags.Notified, true)
					)
					|| (
						(subFlags & CompoundFlags.Recursed)
						&& !(subFlags & CompoundFlags.Tracking)
						&& (compound.flags = (subFlags & ~CompoundFlags.Recursed) | targetFlag | CompoundFlags.Notified, true)
					)
					|| (
						!(subFlags & CompoundFlags.Propagated)
						&& isValidLink(link, compound)
						&& (
							compound.flags = subFlags | CompoundFlags.Recursed | targetFlag | CompoundFlags.Notified,
							(compound as Particle).compounds !== undefined
						)
					)
				) {
					const compoundCompounds = (compound as Particle).compounds;
					if (compoundCompounds !== undefined) {
						if (compoundCompounds.nextCompound !== undefined) {
							compoundCompounds.prevCompound = compounds;
							link = compounds = compoundCompounds;
							targetFlag = CompoundFlags.PendingMemoized;
							++stack;
						} else {
							link = compoundCompounds;
							targetFlag = subFlags & CompoundFlags.Effect
								? CompoundFlags.PendingEffect
								: CompoundFlags.PendingMemoized;
						}
						continue;
					}
					if (subFlags & CompoundFlags.Effect) {
						if (queuedEffectsTail !== undefined) {
							queuedEffectsTail.particlesTail!.nextParticle = compound.atoms;
						} else {
							queuedEffects = compound;
						}
						queuedEffectsTail = compound;
					}
				} else if (!(subFlags & (CompoundFlags.Tracking | targetFlag))) {
					compound.flags = subFlags | targetFlag | CompoundFlags.Notified;
					if ((subFlags & (CompoundFlags.Effect | CompoundFlags.Notified)) === CompoundFlags.Effect) {
						if (queuedEffectsTail !== undefined) {
							queuedEffectsTail.particlesTail!.nextParticle = compound.atoms;
						} else {
							queuedEffects = compound;
						}
						queuedEffectsTail = compound;
					}
				} else if (
					!(subFlags & targetFlag)
					&& (subFlags & CompoundFlags.Propagated)
					&& isValidLink(link, compound)
				) {
					compound.flags = subFlags | targetFlag;
				}

				if ((link = compounds.nextCompound!) !== undefined) {
					compounds = link;
					targetFlag = stack
						? CompoundFlags.PendingMemoized
						: CompoundFlags.Dirty;
					continue;
				}

				while (stack) {
					--stack;
					const particle = compounds.particle;
					const particleSubs = particle.compounds!;
					compounds = particleSubs.prevCompound!;
					particleSubs.prevCompound = undefined;
					if ((link = compounds.nextCompound!) !== undefined) {
						compounds = link;
						targetFlag = stack
							? CompoundFlags.PendingMemoized
							: CompoundFlags.Dirty;
						continue top;
					}
				}

				break;
			} while (true);
		},
		/**
		 * Prepares the given compound to track new atoms.
		 * 
		 * It resets the compound's internal pointers (e.g., particlesTail) and
		 * sets its flags to indicate it is now tracking particle links.
		 * 
		 * @param compound - The compound to start tracking.
		 */
		startTracking(compound: Compound): void {
			compound.particlesTail = undefined;
			compound.flags = (compound.flags & ~(CompoundFlags.Notified | CompoundFlags.Recursed | CompoundFlags.Propagated)) | CompoundFlags.Tracking;
		},
		/**
		 * Concludes tracking of atoms for the specified compound.
		 * 
		 * It clears or unlinks any tracked particle information, then
		 * updates the compound's flags to indicate tracking is complete.
		 * 
		 * @param compound - The compound whose tracking is ending.
		 */
		endTracking(compound: Compound): void {
			const particlesTail = compound.particlesTail;
			if (particlesTail !== undefined) {
				const nextParticle = particlesTail.nextParticle;
				if (nextParticle !== undefined) {
					clearTracking(nextParticle);
					particlesTail.nextParticle = undefined;
				}
			} else if (compound.atoms !== undefined) {
				clearTracking(compound.atoms);
				compound.atoms = undefined;
			}
			compound.flags &= ~CompoundFlags.Tracking;
		},
		/**
		 * Updates the dirty flag for the given compound based on its atoms.
		 * 
		 * If the compound has any pending memoizeds, this function sets the Dirty flag
		 * and returns `true`. Otherwise, it clears the PendingMemoized flag and returns `false`.
		 * 
		 * @param compound - The compound to update.
		 * @param flags - The current flag set for this compound.
		 * @returns `true` if the compound is marked as Dirty; otherwise `false`.
		 */
		updateDirtyFlag(compound: Compound, flags: CompoundFlags): boolean {
			if (checkDirty(compound.atoms!)) {
				compound.flags = flags | CompoundFlags.Dirty;
				return true;
			} else {
				compound.flags = flags & ~CompoundFlags.PendingMemoized;
				return false;
			}
		},
		/**
		 * Updates the memoized compound if necessary before its value is accessed.
		 * 
		 * If the compound is marked Dirty or PendingMemoized, this function runs
		 * the provided updateMemoized logic and triggers a shallowPropagate for any
		 * downstream subscribers if an actual update occurs.
		 * 
		 * @param memoized - The memoized compound to update.
		 * @param flags - The current flag set for this compound.
		 */
		processMemoizedUpdate(memoized: Particle & Compound, flags: CompoundFlags): void {
			if (
				flags & CompoundFlags.Dirty
				|| (
					checkDirty(memoized.atoms!)
						? true
						: (memoized.flags = flags & ~CompoundFlags.PendingMemoized, false)
				)
			) {
				if (updateMemoized(memoized)) {
					const compounds = memoized.compounds;
					if (compounds !== undefined) {
						shallowPropagate(compounds);
					}
				}
			}
		},
		/**
		 * Ensures all pending internal effects for the given compound are processed.
		 * 
		 * This should be called after an effect decides not to re-run itself but may still
		 * have atoms flagged with PendingEffect. If the compound is flagged with
		 * PendingEffect, this function clears that flag and invokes `notifyEffect` on any
		 * related atoms marked as Effect and Propagated, processing pending effects.
		 * 
		 * @param compound - The compound which may have pending effects.
		 * @param flags - The current flags on the compound to check.
		 */
		processPendingInnerEffects(compound: Compound, flags: CompoundFlags): void {
			if (flags & CompoundFlags.PendingEffect) {
				compound.flags = flags & ~CompoundFlags.PendingEffect;
				let link = compound.atoms!;
				do {
					const particle = link.particle;
					if (
						'flags' in particle
						&& particle.flags & CompoundFlags.Effect
						&& particle.flags & CompoundFlags.Propagated
					) {
						notifyEffect(particle);
					}
					link = link.nextParticle!;
				} while (link !== undefined);
			}
		},
		/**
		 * Processes queued effect notifications after a batch operation finishes.
		 * 
		 * Iterates through all queued effects, calling notifyEffect on each.
		 * If an effect remains partially handled, its flags are updated, and future
		 * notifications may be triggered until fully handled.
		 */
		processEffectNotifications(): void {
			while (queuedEffects !== undefined) {
				const effect = queuedEffects;
				const particlesTail = effect.particlesTail!;
				const queuedNext = particlesTail.nextParticle;
				if (queuedNext !== undefined) {
					particlesTail.nextParticle = undefined;
					queuedEffects = queuedNext.compound;
				} else {
					queuedEffects = undefined;
					queuedEffectsTail = undefined;
				}
				if (!notifyEffect(effect)) {
					effect.flags &= ~CompoundFlags.Notified;
				}
			}
		},
	};

	/**
	 * Creates and attaches a new link between the given particle and compound.
	 * 
	 * Reuses a link object from the linkPool if available. The newly formed link 
	 * is added to both the particle's linked list and the compound's linked list.
	 * 
	 * @param particle - The particle to link.
	 * @param compound - The compound to be attached to this particle.
	 * @param nextParticle - The next link in the compound's chain.
	 * @param particlesTail - The current tail link in the compound's chain.
	 * @returns The newly created link object.
	 */
	function linkNewParticle(particle: Particle, compound: Compound, nextParticle: Link | undefined, particlesTail: Link | undefined): Link {
		const newLink: Link = {
			particle,
			compound,
			nextParticle,
			prevCompound: undefined,
			nextCompound: undefined,
		};

		if (particlesTail === undefined) {
			compound.atoms = newLink;
		} else {
			particlesTail.nextParticle = newLink;
		}

		if (particle.compounds === undefined) {
			particle.compounds = newLink;
		} else {
			const oldTail = particle.compoundsTail!;
			newLink.prevCompound = oldTail;
			oldTail.nextCompound = newLink;
		}

		compound.particlesTail = newLink;
		particle.compoundsTail = newLink;

		return newLink;
	}

	/**
	 * Recursively checks and updates all memoized subscribers marked as pending.
	 * 
	 * It traverses the linked structure using a stack mechanism. For each memoized
	 * compound in a pending state, updateMemoized is called and shallowPropagate
	 * is triggered if a value changes. Returns whether any updates occurred.
	 * 
	 * @param link - The starting link representing a sequence of pending memoizeds.
	 * @returns `true` if a memoized was updated, otherwise `false`.
	 */
	function checkDirty(link: Link): boolean {
		let stack = 0;
		let dirty: boolean;

		top: do {
			dirty = false;
			const particle = link.particle;

			if ('flags' in particle) {
				const particleFlags = particle.flags;
				if ((particleFlags & (CompoundFlags.Memoized | CompoundFlags.Dirty)) === (CompoundFlags.Memoized | CompoundFlags.Dirty)) {
					if (updateMemoized(particle)) {
						const compounds = particle.compounds!;
						if (compounds.nextCompound !== undefined) {
							shallowPropagate(compounds);
						}
						dirty = true;
					}
				} else if ((particleFlags & (CompoundFlags.Memoized | CompoundFlags.PendingMemoized)) === (CompoundFlags.Memoized | CompoundFlags.PendingMemoized)) {
					const particleSubs = particle.compounds!;
					if (particleSubs.nextCompound !== undefined) {
						particleSubs.prevCompound = link;
					}
					link = particle.atoms!;
					++stack;
					continue;
				}
			}

			if (!dirty && link.nextParticle !== undefined) {
				link = link.nextParticle;
				continue;
			}

			if (stack) {
				let compound = link.compound as Particle & Compound;
				do {
					--stack;
					const compoundCompounds = compound.compounds!;

					if (dirty) {
						if (updateMemoized(compound)) {
							if ((link = compoundCompounds.prevCompound!) !== undefined) {
								compoundCompounds.prevCompound = undefined;
								shallowPropagate(compound.compounds!);
								compound = link.compound as Particle & Compound;
							} else {
								compound = compoundCompounds.compound as Particle & Compound;
							}
							continue;
						}
					} else {
						compound.flags &= ~CompoundFlags.PendingMemoized;
					}

					if ((link = compoundCompounds.prevCompound!) !== undefined) {
						compoundCompounds.prevCompound = undefined;
						if (link.nextParticle !== undefined) {
							link = link.nextParticle;
							continue top;
						}
						compound = link.compound as Particle & Compound;
					} else {
						if ((link = compoundCompounds.nextParticle!) !== undefined) {
							continue top;
						}
						compound = compoundCompounds.compound as Particle & Compound;
					}

					dirty = false;
				} while (stack);
			}

			return dirty;
		} while (true);
	}

	/**
	 * Quickly propagates PendingMemoized status to Dirty for each compound in the chain.
	 * 
	 * If the compound is also marked as an effect, it is added to the queuedEffects list
	 * for later processing.
	 * 
	 * @param link - The head of the linked list to process.
	 */
	function shallowPropagate(link: Link): void {
		do {
			const compound = link.compound;
			const subFlags = compound.flags;
			if ((subFlags & (CompoundFlags.PendingMemoized | CompoundFlags.Dirty)) === CompoundFlags.PendingMemoized) {
				compound.flags = subFlags | CompoundFlags.Dirty | CompoundFlags.Notified;
				if ((subFlags & (CompoundFlags.Effect | CompoundFlags.Notified)) === CompoundFlags.Effect) {
					if (queuedEffectsTail !== undefined) {
						queuedEffectsTail.particlesTail!.nextParticle = compound.atoms;
					} else {
						queuedEffects = compound;
					}
					queuedEffectsTail = compound;
				}
			}
			link = link.nextCompound!;
		} while (link !== undefined);
	}

	/**
	 * Verifies whether the given link is valid for the specified compound.
	 * 
	 * It iterates through the compound's link list (from compound.atoms to compound.particlesTail)
	 * to determine if the provided link object is part of that chain.
	 * 
	 * @param checkLink - The link object to validate.
	 * @param compound - The compound whose link list is being checked.
	 * @returns `true` if the link is found in the compound's list; otherwise `false`.
	 */
	function isValidLink(checkLink: Link, compound: Compound): boolean {
		const particlesTail = compound.particlesTail;
		if (particlesTail !== undefined) {
			let link = compound.atoms!;
			do {
				if (link === checkLink) {
					return true;
				}
				if (link === particlesTail) {
					break;
				}
				link = link.nextParticle!;
			} while (link !== undefined);
		}
		return false;
	}

	/**
	 * Clears particle-subscription relationships starting at the given link.
	 * 
	 * Detaches the link from both the particle and compound, then continues 
	 * to the next link in the chain. The link objects are returned to linkPool for reuse.
	 * 
	 * @param link - The head of a linked chain to be cleared.
	 */
	function clearTracking(link: Link): void {
		do {
			const particle = link.particle;
			const nextParticle = link.nextParticle;
			const nextCompound = link.nextCompound;
			const prevCompound = link.prevCompound;

			if (nextCompound !== undefined) {
				nextCompound.prevCompound = prevCompound;
			} else {
				particle.compoundsTail = prevCompound;
			}

			if (prevCompound !== undefined) {
				prevCompound.nextCompound = nextCompound;
			} else {
				particle.compounds = nextCompound;
			}

			if (particle.compounds === undefined && 'atoms' in particle) {
				const particleFlags = particle.flags;
				if (!(particleFlags & CompoundFlags.Dirty)) {
					particle.flags = particleFlags | CompoundFlags.Dirty;
				}
				const particleParticles = particle.atoms;
				if (particleParticles !== undefined) {
					link = particleParticles;
					particle.particlesTail!.nextParticle = nextParticle;
					particle.atoms = undefined;
					particle.particlesTail = undefined;
					continue;
				}
			}
			link = nextParticle!;
		} while (link !== undefined);
	}
}