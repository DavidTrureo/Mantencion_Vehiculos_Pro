package com.mantenimiento.vehiculospro_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class NhtsaModelResponse {
    @JsonProperty("Count")
    private int count;
    @JsonProperty("Message")
    private String message;
    @JsonProperty("Results")
    private List<NhtsaModel> results;

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<NhtsaModel> getResults() { return results; }
    public void setResults(List<NhtsaModel> results) { this.results = results; }

    public static class NhtsaModel {
        @JsonProperty("Make_ID")
        private int makeId;
        @JsonProperty("Make_Name")
        private String makeName;
        @JsonProperty("Model_ID")
        private int modelId;
        @JsonProperty("Model_Name")
        private String modelName;

        public int getMakeId() { return makeId; }
        public void setMakeId(int makeId) { this.makeId = makeId; }

        public String getMakeName() { return makeName; }
        public void setMakeName(String makeName) { this.makeName = makeName; }

        public int getModelId() { return modelId; }
        public void setModelId(int modelId) { this.modelId = modelId; }

        public String getModelName() { return modelName; }
        public void setModelName(String modelName) { this.modelName = modelName; }
    }
}
