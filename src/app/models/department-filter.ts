export interface DepartmentFilter {
    id_department?: number|string;
    name?: string;
    active?: boolean;

    page?: number;
    size?: number;
    sort?: number;
}