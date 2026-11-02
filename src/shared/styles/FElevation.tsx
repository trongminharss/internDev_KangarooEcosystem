import {Platform} from 'react-native';

export const Felevation = {
  top1: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.03)',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
        backgroundColor: 'white',
      },
    }),
  },
  top2: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.06)',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
        backgroundColor: 'white',
      },
    }),
  },
  bottom1: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.03)',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
        backgroundColor: 'white',
      },
    }),
  },
  bottom2: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.06)',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
        backgroundColor: 'white',
      },
    }),
  },
  right1: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.03)',
        shadowOffset: {width: 4, height: 0},
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
        backgroundColor: 'white',
      },
    }),
  },
  right2: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.06)',
        shadowOffset: {width: 4, height: 0},
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
        backgroundColor: 'white',
      },
    }),
  },
  left1: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.03)',
        shadowOffset: {width: -4, height: 0},
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
        backgroundColor: 'white',
      },
    }),
  },
  left2: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.06)',
        shadowOffset: {width: -4, height: 0},
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
        backgroundColor: 'white',
      },
    }),
  },
};
