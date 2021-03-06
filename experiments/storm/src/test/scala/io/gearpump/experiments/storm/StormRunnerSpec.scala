/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


package io.gearpump.experiments.storm

import akka.actor.{ActorSystem, Props}
import akka.testkit.TestProbe
import io.gearpump.cluster.TestUtil
import io.gearpump.cluster.client.ClientContext
import io.gearpump.experiments.storm.Commands.{AppKilled, AppSubmitted, Kill, Submit}
import io.gearpump.experiments.storm.StormRunner.Handler
import io.gearpump.experiments.storm.util.TopologyUtil
import org.mockito.Matchers._
import org.mockito.Mockito
import org.scalatest.{FlatSpec, Matchers}

class StormRunnerSpec extends FlatSpec with Matchers {
  it should "handle submit/kill correctly"  in {
    val conf = TestUtil.DEFAULT_CONFIG
    implicit val system = ActorSystem("storm-test", conf)

    val uploadedJarLocation = "local"
    val jsonConf = "storm_json_conf"
    val topology = TopologyUtil.getTestTopology

    implicit val dispatcher = system.dispatcher
    val clientContext = Mockito.mock(classOf[ClientContext])
    Mockito.when(clientContext.submit(any(), any())).thenReturn(0)
    val handler = system.actorOf(Props(new Handler(clientContext, "jar", "user_config")))
    val client = TestProbe()

    client.send(handler, Submit("app", uploadedJarLocation, jsonConf, topology, null))
    client.expectMsg(AppSubmitted("app", 0))


    client.send(handler, Kill("app", null))
    client.expectMsg(AppKilled("app", 0))

    system.shutdown()
  }
}
