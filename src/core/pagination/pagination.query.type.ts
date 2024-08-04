import { Order } from "sequelize"
import { KondoWhereOptions } from "../../kondo/repository/kondo.where.options"

export type PaginationQuery = {
    attributes?: (string | any)[],
    limit?: number,
    order?: Order,
    offset?: number,
    where?: KondoWhereOptions | any,
    include?: object,
    group?: string
}