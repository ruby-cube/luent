import { describe, test, expect, vi, beforeEach, it } from "vitest";
import { makeActiveListener } from "../Listener";
import { onFlaskDiscard, getActiveFlask, EffectFlask } from "../EffectFlask";

vi.mock('../EffectFlask', () => ({
    onFlaskDiscard: vi.fn(),
    // bindFlask: vi.fn(),
    getActiveFlask: vi.fn()
}));

describe("Listener", () => {
    let enroll: ReturnType<typeof vi.fn>;
    let remove: ReturnType<typeof vi.fn>;
    let callback: ReturnType<typeof vi.fn>;
    let until: ReturnType<typeof vi.fn>;
    let config: any;

    beforeEach(() => {
        vi.clearAllMocks();
        enroll = vi.fn();
        remove = vi.fn();
        callback = vi.fn();
        until = vi.fn();
        config = {
            enroll,
            remove,
            callback,
            options: {},
        };
        vi.mocked(onFlaskDiscard).mockImplementation(vi.fn());
        // vi.mocked(bindFlask).mockImplementation(cb => cb);
        vi.mocked(getActiveFlask).mockImplementation(() => ({} as EffectFlask));
    });


    it('should enroll the callback and return an Listener', () => {
        const listener = makeActiveListener(config);

        expect(enroll).toHaveBeenCalledOnce();
        expect(enroll).toHaveBeenCalledWith(expect.any(Function));
        expect(listener).toHaveProperty('stop');
    });


    it('should call the remove function when stop is called', () => {
        const listener = makeActiveListener(config);

        listener.stop();

        expect(enroll).toHaveBeenCalledOnce();
        expect(remove).toHaveBeenCalledWith(expect.any(Function));
    });


    it('should call the callback when the wrapped callback is invoked', () => {
        makeActiveListener(config);
        const wrappedCallback = enroll.mock.calls[0][0];

        wrappedCallback();

        expect(callback).toHaveBeenCalled();
    });


    it('should remove the listener after callback if `once` is set to true', () => {
        config.options.once = true;
        makeActiveListener(config);
        const wrappedCallback = enroll.mock.calls[0][0];

        wrappedCallback();

        expect(remove).toHaveBeenCalledWith(wrappedCallback);
    });


    it('should call `until` function with `stop` function if `until` is provided', () => {
        config.options.until = until;
        const listener = makeActiveListener(config);

        expect(until).toHaveBeenCalledWith(listener.stop);
    });


    it('should call `pendingStop.cancel()` if provided when `stop` is called', () => {
        const cancelMock = vi.fn();
        until.mockReturnValue({ cancel: cancelMock });
        config.options.until = until;

        const listener = makeActiveListener(config);
        listener.stop();

        expect(cancelMock).toHaveBeenCalled();
    });

   //  it('should not call onFlaskDiscard if custom flask passed in; call flask.onDiscard instead', () => {
   //      const flask = { onDiscard: vi.fn() };
   //      config.options.flask = flask;

   //      makeActiveListener(config);

   //      expect(onFlaskDiscard).not.toHaveBeenCalled();

   //      expect(flask.onDiscard).toHaveBeenCalledOnce();
   //      expect(flask.onDiscard).toHaveBeenCalledWith(expect.any(Function));
   //  });

    it('should call onFlaskDiscard', () => {
        config.options = {}

        makeActiveListener(config);

        expect(onFlaskDiscard).toHaveBeenCalledOnce();
        expect(onFlaskDiscard).toHaveBeenCalledWith(expect.any(Function));
    });

   //  it('should not call onFlaskDiscard if flask === "outlive"', () => {
   //      config.options.flask = 'outlive';

   //      makeActiveListener(config);

   //      expect(onFlaskDiscard).not.toHaveBeenCalled();

   //  });


    it('should handle missing options object gracefully', () => {
        config.options = undefined;

        expect(() => makeActiveListener(config)).not.toThrow();
        const listener = makeActiveListener(config);
        expect(listener).toHaveProperty('stop');
    });


    it('should handle multiple calls to stop gracefully', () => {
        const listener = makeActiveListener(config);

        listener.stop();
        listener.stop();

        expect(remove).toHaveBeenCalledTimes(1);
    });


    it('should handle until returning null or undefined gracefully', () => {
        until.mockReturnValue(null);
        config.options.until = until;

        const listener = makeActiveListener(config);

        expect(() => listener.stop()).not.toThrow();
        expect(remove).toHaveBeenCalled();
    });


    it('should handle errors thrown by the remove function', () => {
        const error = new Error('Remove error');
        remove.mockImplementation(() => { throw error; });

        const listener = makeActiveListener(config);

        expect(() => listener.stop()).toThrow(error);
    });


    it('should still remove a `once` listener if callback throws an error', () => {
        const error = new Error('Test error');
        callback.mockImplementation(() => { throw error; });
        config.options.once = true;

        const listener = makeActiveListener(config);
        const wrappedCallback = enroll.mock.calls[0][0];

        expect(() => wrappedCallback()).toThrow(error);
        expect(remove).toHaveBeenCalled();
    });


    it('should handle missing callback gracefully', () => {
        config.callback = undefined;

        expect(() => makeActiveListener(config)).not.toThrow();
    });
})