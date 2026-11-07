export interface Branch {
  id_branch: number;
  name: string;
  city: string;
  address: string;
  active: boolean;
}

export type BranchRequest = Pick<Branch, 'name' | 'city' | 'address'>;
export type BranchUpdate = BranchRequest & { active?: boolean };
