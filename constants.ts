import { TreeNode } from './types';

export const INITIAL_DATA: TreeNode = {
  id: 'root',
  name: 'My Life',
  type: 'root',
  status: 'keep',
  children: [
    {
      id: 'mind',
      name: 'Mind (Mental Realm)',
      type: 'realm',
      status: 'keep',
      children: []
    },
    {
      id: 'body',
      name: 'Body (Physical Realm)',
      type: 'realm',
      status: 'keep',
      children: []
    }
  ]
};

export const STATUS_COLORS = {
  keep: '#10b981',   // emerald-500
  review: '#f59e0b', // amber-500
  discard: '#ef4444', // red-500
  sell: '#8b5cf6',    // violet-500
  donate: '#3b82f6'   // blue-500
};

export const USER_CONTEXT = `
Starting hobbies: golf, hockey, RC cars, chess, electronics, programming, gaming, photography, guitar, music production, cards, magic, board games, model painting, reading, landscaping, climbing, tree trimming, dogs, aquariums, cats, art, technology, software consulting, website building, psychology, teaching, mentoring, motorcycles, shooting sports, airsoft.
artifacts: chess board collection, playing card collection, guitar collection, climbing gear rack, trad climbing rig, tree climbing gear, electronic chess computer collection, magic sets, board game library, non-fiction book library, guitar wall art, artist sets, paints, modeling kits, rpg modeling battle sets, motorcycle helmets, camera gear, premium camera lenses, economy camera lenses, electronic parts, microcontrollers, collectable grade playing cards, airsoft guns, collectable vintage guns, limited edition guitars, limited edition guns, limited edition playing cards, computers.
`;
