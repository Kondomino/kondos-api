import { Order } from "sequelize"
import { KondoWhereOptions } from "../../kondo/repository/kondo.where.options"

export type PaginationQuery = {
    limit?: number,
    order?: Order,
    offset?: number,
    where?: KondoWhereOptions
}