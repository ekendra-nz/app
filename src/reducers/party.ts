import { Actions, Types } from '../actions';
import { firebaseTrackIdSelector } from '../selectors/track';
import { ConnectionState, PartyState, Track } from '../state';

const VOTE_FACTOR = 1e12;

export default function (
    state: PartyState = {
        connectionState: ConnectionState.Unknown,
        currentParty: null,
        hasTracksLoaded: false,
        partyLoadError: null,
        partyLoadInProgress: false,
        tracks: null,
        userVotes: null,
    },
    action: Actions,
): PartyState {
    switch (action.type) {
        case Types.OPEN_PARTY_Start:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: true,
            };
        case Types.OPEN_PARTY_Fail:
            return {
                ...state,
                partyLoadError: action.payload,
                partyLoadInProgress: false,
            };
        case Types.OPEN_PARTY_Finish:
            return {
                ...state,
                partyLoadError: null,
                partyLoadInProgress: false,
            };
        case Types.SET_VOTE:
            const [ref, vote] = action.payload;
            const trackId = firebaseTrackIdSelector(ref);

            const trackList: Record<string, Track> = { ...state.tracks };
            if (state.tracks && state.tracks[trackId]) {
                const track = trackList[trackId];
                const voteQuantifier = vote ? -1 : 1;

                // Precompute order for quicker UI reaction
                trackList[trackId] = {
                    ...track,
                    order: track.order + (VOTE_FACTOR * voteQuantifier),
                    vote_count: track.vote_count - voteQuantifier,
                };
            }

            return {
                ...state,
                tracks: trackList,
                userVotes: {
                    ...state.userVotes,
                    [trackId]: vote,
                },
            };
        case Types.UPDATE_NETWORK_CONNECTION_STATE:
            return {
                ...state,
                connectionState: action.payload,
            };
        case Types.UPDATE_PARTY:
            return {
                ...state,
                currentParty: action.payload,
            };
        case Types.UPDATE_TRACKS:
            return {
                ...state,
                hasTracksLoaded: true,
                tracks: action.payload,
            };
        case Types.UPDATE_USER_VOTES:
            return {
                ...state,
                userVotes: action.payload,
            };
        case Types.UPDATE_PLAYBACK_STATE:
            if (!state.currentParty) {
                return state;
            }

            return {
                ...state,
                currentParty: {
                    ...state.currentParty,
                    playback: {
                        ...state.currentParty.playback,
                        ...action.payload,
                    },
                },
            };
        case Types.CLEANUP_PARTY:
            return {
                connectionState: ConnectionState.Unknown,
                currentParty: null,
                hasTracksLoaded: false,
                partyLoadError: null,
                partyLoadInProgress: false,
                userVotes: null,
                tracks: null,
            };
        default:
            return state;
    }
}
