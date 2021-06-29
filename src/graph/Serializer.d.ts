import { Graph } from './Graph';
import { GraphJson } from './types';

/**
 * Serializes a graph into a JavaScript object.
 * It is safe to call `JSON.stringify()` on the result.
 * 
 * @param graph target to create JSON representation of.
 * @returns JSON serializable graph representation
 */
export declare function serialize<G, N, E>(g: Graph<G, N, E>): GraphJson<G, N, E>;

/**
 * Reads the previously serialized graph and restores the graph object.
 *
 * @example
 * var g2 = graphlib.json.read(JSON.parse(str));
 * g2.nodes();
 * // ['a', 'b']
 * g2.edges()
 * // [ { v: 'a', w: 'b' } ]
 * 
 * @param json - JSON serializable graph representation
 * @returns graph constructed according to specified representation
 */
export declare function deserialize<G, N, E>(json: GraphJson<G, N, E>): Graph<G, N, E>;
