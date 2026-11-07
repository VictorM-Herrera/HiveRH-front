export interface Position {
  id_position: number;
  name: string;
  active: boolean;
}

export interface PositionFilters {
  name?: string;
  active?: boolean;
}
